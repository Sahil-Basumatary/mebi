import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyGithubSignature, pathsFromPushPayload, isDeletedRef } from "@/lib/github/webhook";
import { deleteInstallation, syncInstallationRepos } from "@/lib/github/install";
import { inngest } from "@/inngest/client";

async function enqueue(name: "repo/sync.requested" | "repo/push.received", data: Record<string, unknown>) {
  await inngest.send({ name, data });
}

export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "unconfigured" }, { status: 500 });
  }
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyGithubSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event") ?? "";
  const delivery = request.headers.get("x-github-delivery") ?? "";
  if (delivery) {
    try {
      await prisma.githubWebhookDelivery.create({
        data: { id: delivery, event },
      });
    } catch {
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    if (delivery) {
      await prisma.githubWebhookDelivery.delete({ where: { id: delivery } }).catch(() => undefined);
    }
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  try {
    if (event === "installation") {
      const action = String(payload.action ?? "");
      const installation = payload.installation as { id?: number } | undefined;
      const installationId = installation?.id ? String(installation.id) : null;
      if (installationId && (action === "deleted" || action === "suspend")) {
        await deleteInstallation(installationId);
      }
    }

    if (event === "installation_repositories") {
      const installation = payload.installation as { id?: number } | undefined;
      const installationId = installation?.id ? String(installation.id) : null;
      if (installationId) {
        const local = await prisma.githubInstallation.findUnique({
          where: { installationId },
          select: { id: true },
        });
        if (local) {
          await syncInstallationRepos(local.id, installationId);
          const added = Array.isArray(payload.repositories_added) ? payload.repositories_added : [];
          for (const row of added) {
            const githubRepoId =
              row && typeof row === "object" && "id" in row ? String((row as { id?: number }).id ?? "") : "";
            if (!githubRepoId) continue;
            const repo = await prisma.githubRepository.findUnique({
              where: { githubRepoId },
              select: { id: true },
            });
            if (repo) {
              await enqueue("repo/sync.requested", { repositoryId: repo.id });
            }
          }
        }
      }
    }

    if (event === "push") {
      const repository = payload.repository as { id?: number } | undefined;
      const after = typeof payload.after === "string" ? payload.after : null;
      if (repository?.id && !isDeletedRef(after)) {
        const local = await prisma.githubRepository.findUnique({
          where: { githubRepoId: String(repository.id) },
          select: { id: true },
        });
        if (local) {
          const paths = pathsFromPushPayload(payload);
          const incremental = paths.changed.length + paths.removed.length > 0;
          await enqueue("repo/push.received", {
            repositoryId: local.id,
            after,
            changedPaths: incremental ? paths.changed : undefined,
            removedPaths: incremental ? paths.removed : undefined,
          });
        }
      }
    }
  } catch {
    if (delivery) {
      await prisma.githubWebhookDelivery.delete({ where: { id: delivery } }).catch(() => undefined);
    }
    console.error("github_webhook_failed");
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
