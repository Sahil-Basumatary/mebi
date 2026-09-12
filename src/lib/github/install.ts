import "server-only";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { githubAppSlug, getInstallation, listInstallationRepos, deleteRemoteInstallation } from "@/lib/github/app";
import { appOrigin } from "@/lib/app-origin";

const NONCE_TTL_MS = 15 * 60 * 1000;

export async function createGithubInstallUrl(userId: string): Promise<string> {
  const slug = githubAppSlug();
  if (!slug) {
    throw new Error("GITHUB_APP_SLUG is missing.");
  }
  const nonce = randomBytes(24).toString("hex");
  await prisma.githubInstallNonce.create({
    data: {
      userId,
      nonce,
      expiresAt: new Date(Date.now() + NONCE_TTL_MS),
    },
  });
  const origin = appOrigin() ?? "";
  const setup = origin ? `&redirect_url=${encodeURIComponent(`${origin}/api/github/setup`)}` : "";
  return `https://github.com/apps/${encodeURIComponent(slug)}/installations/new?state=${nonce}${setup}`;
}

export async function consumeInstallNonce(userId: string, nonce: string | null): Promise<boolean> {
  if (!nonce || !/^[a-f0-9]{48}$/.test(nonce)) return false;
  const row = await prisma.githubInstallNonce.findUnique({ where: { nonce } });
  if (!row || row.userId !== userId) return false;
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.githubInstallNonce.delete({ where: { id: row.id } }).catch(() => undefined);
    return false;
  }
  await prisma.githubInstallNonce.delete({ where: { id: row.id } });
  return true;
}

export async function upsertInstallationForUser(userId: string, installationId: string) {
  const installation = await getInstallation(installationId);
  const saved = await prisma.githubInstallation.upsert({
    where: { installationId },
    create: {
      userId,
      installationId,
      accountLogin: installation.account.login,
      accountId: String(installation.account.id),
    },
    update: {
      userId,
      accountLogin: installation.account.login,
      accountId: String(installation.account.id),
    },
  });
  await syncInstallationRepos(saved.id, installationId);
  return saved;
}

export async function syncInstallationRepos(localInstallationId: string, installationId: string) {
  const remote = await listInstallationRepos(installationId);
  const remoteIds = new Set(remote.map((repo) => String(repo.id)));
  const existing = await prisma.githubRepository.findMany({
    where: { installationId: localInstallationId },
    select: { id: true, githubRepoId: true },
  });

  for (const repo of existing) {
    if (!remoteIds.has(repo.githubRepoId)) {
      await prisma.githubRepository.delete({ where: { id: repo.id } });
    }
  }

  for (const repo of remote) {
    await prisma.githubRepository.upsert({
      where: { githubRepoId: String(repo.id) },
      create: {
        installationId: localInstallationId,
        githubRepoId: String(repo.id),
        owner: repo.owner.login,
        name: repo.name,
        defaultBranch: repo.default_branch,
        private: repo.private,
      },
      update: {
        installationId: localInstallationId,
        owner: repo.owner.login,
        name: repo.name,
        defaultBranch: repo.default_branch,
        private: repo.private,
      },
    });
  }
}

export async function deleteInstallation(installationId: string) {
  await prisma.githubInstallation.deleteMany({ where: { installationId } });
}

export async function disconnectInstallation(userId: string, installationId: string) {
  const row = await prisma.githubInstallation.findFirst({
    where: { userId, installationId },
    select: { installationId: true },
  });
  if (!row) return false;
  try {
    await deleteRemoteInstallation(row.installationId);
  } catch {
    // Local data still has to go even if GitHub already removed the install.
  }
  await deleteInstallation(row.installationId);
  return true;
}

export async function listUserInstallations(userId: string) {
  return prisma.githubInstallation.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      repositories: {
        orderBy: [{ owner: "asc" }, { name: "asc" }],
        include: { project: { select: { id: true, name: true } } },
      },
    },
  });
}
