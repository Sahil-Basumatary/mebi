import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { consumeInstallNonce, upsertInstallationForUser } from "@/lib/github/install";
import { inngest } from "@/inngest/client";
import { appOrigin } from "@/lib/app-origin";

export async function GET(request: Request) {
  const origin = appOrigin() || new URL(request.url).origin;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", origin));
  }
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", origin));
  }

  const url = new URL(request.url);
  const installationId = url.searchParams.get("installation_id");
  const setupAction = url.searchParams.get("setup_action");
  const state = url.searchParams.get("state");

  if (!installationId || !/^\d+$/.test(installationId)) {
    return NextResponse.redirect(new URL("/home?settings=connections&github=error", origin));
  }

  const nonceOk = await consumeInstallNonce(user.id, state);
  if (!nonceOk) {
    return NextResponse.redirect(new URL("/home?settings=connections&github=error", origin));
  }

  if (setupAction === "request") {
    return NextResponse.redirect(new URL("/home?settings=connections&github=pending", origin));
  }

  try {
    const installation = await upsertInstallationForUser(user.id, installationId);
    const repos = await prisma.githubRepository.findMany({
      where: { installationId: installation.id },
      select: { id: true },
    });
    await Promise.all(
      repos.map((repo) =>
        inngest.send({ name: "repo/sync.requested", data: { repositoryId: repo.id } }),
      ),
    );
    return NextResponse.redirect(new URL("/home?settings=connections&github=connected", origin));
  } catch {
    return NextResponse.redirect(new URL("/home?settings=connections&github=error", origin));
  }
}
