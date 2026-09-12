import "server-only";

import { prisma } from "@/lib/prisma";
import { getFileContent, getRepoTree } from "@/lib/github/app";
import { languageFromPath, shouldIndexPath } from "@/lib/github/filter";
import { redactSecrets } from "@/lib/ai/redact";
import { runProjectAi } from "@/lib/ai/run";
import { wrapUntrusted } from "@/lib/ai/untrusted";
import { ACTION_CONTEXT_CHARS } from "@/lib/ai/quota";

const MAX_FILES = 400;
const MAX_SUMMARY_FILES = 80;

async function maybeWriteBackgroundSummary(input: {
  repositoryId: string;
  userId: string;
  privateRepo: boolean;
  owner: string;
  name: string;
  files: Array<{ path: string; role: string; language: string | null }>;
  currentSummary: string | null;
}) {
  if (input.currentSummary && !input.currentSummary.startsWith("Indexed ")) return;
  const facts = input.files
    .slice(0, MAX_SUMMARY_FILES)
    .map((file) => `${file.path} [${file.role}/${file.language ?? "unknown"}]`)
    .join("\n")
    .slice(0, ACTION_CONTEXT_CHARS.BACKGROUND_INDEX);
  try {
    const result = await runProjectAi({
      userId: input.userId,
      action: "BACKGROUND_INDEX",
      userPrompt: [
        "Write at most six sentences describing this repository from the file list only.",
        "Cite paths that appear in the facts. Do not invent files.",
        wrapUntrusted("REPO_FACTS", facts || `${input.owner}/${input.name}`),
      ].join("\n\n"),
      requireConsent: input.privateRepo,
    });
    if (!result.ok || !result.text) return;
    await prisma.repoArchitecture.update({
      where: { repositoryId: input.repositoryId },
      data: { summary: result.text.slice(0, 4000), generatedAt: new Date() },
    });
  } catch {
    return;
  }
}

export async function indexRepository(
  repositoryId: string,
  changedPaths?: string[],
  removedPaths?: string[],
) {
  const repo = await prisma.githubRepository.findUnique({
    where: { id: repositoryId },
    include: { installation: true, architecture: true },
  });
  if (!repo) return { indexed: 0 };

  if (removedPaths?.length) {
    await prisma.repoFileIndex.deleteMany({
      where: { repositoryId, path: { in: removedPaths } },
    });
  }

  const tree = await getRepoTree(
    repo.installation.installationId,
    repo.owner,
    repo.name,
    repo.defaultBranch,
  );
  const blobs = (tree.tree ?? []).filter((entry) => entry.type === "blob" && entry.path);
  const selected = blobs.slice(0, MAX_FILES);
  const keepPaths = new Set(selected.map((entry) => entry.path as string));
  const changed = changedPaths ? new Set(changedPaths) : null;

  if (!changed) {
    await prisma.repoFileIndex.deleteMany({
      where: { repositoryId, path: { notIn: [...keepPaths] } },
    });
  }

  const existing = await prisma.repoFileIndex.findMany({
    where: { repositoryId },
    select: { path: true, hash: true },
  });
  const existingHash = new Map(existing.map((row) => [row.path, row.hash]));

  let indexed = 0;
  let dependencies: string[] | null = null;

  for (const entry of selected) {
    const path = entry.path as string;
    if (changed && !changed.has(path)) continue;
    const size = entry.size ?? 0;
    const filter = shouldIndexPath(path, size);
    const gitSha = entry.sha ?? "skip";
    if (!filter.index) {
      await prisma.repoFileIndex.upsert({
        where: { repositoryId_path: { repositoryId, path } },
        create: {
          repositoryId,
          path,
          hash: gitSha,
          language: null,
          bytes: size,
          role: filter.role,
        },
        update: { hash: gitSha, bytes: size, role: filter.role },
      });
      continue;
    }

    if (existingHash.get(path) === gitSha) continue;

    const file = await getFileContent(
      repo.installation.installationId,
      repo.owner,
      repo.name,
      path,
      repo.defaultBranch,
    );
    if (!file) continue;
    const redacted = redactSecrets(file.text);
    const language = languageFromPath(path);
    if (path.endsWith("package.json")) {
      try {
        const pkg = JSON.parse(file.text) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        dependencies = [...new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})])].slice(0, 80);
      } catch {
        dependencies = dependencies ?? [];
      }
    }

    await prisma.repoFileIndex.upsert({
      where: { repositoryId_path: { repositoryId, path } },
      create: {
        repositoryId,
        path,
        hash: gitSha,
        language,
        bytes: file.size,
        role: filter.role,
        summary: redacted.text.slice(0, 240),
      },
      update: {
        hash: gitSha,
        language,
        bytes: file.size,
        role: filter.role,
        summary: redacted.text.slice(0, 240),
      },
    });
    indexed += 1;
  }

  const files = await prisma.repoFileIndex.findMany({
    where: { repositoryId, role: { in: ["source", "config", "docs", "test"] } },
    orderBy: { path: "asc" },
    select: { path: true, role: true, language: true },
  });
  const languages: Record<string, number> = {};
  const modules: Array<{ path: string; role: string; language: string | null }> = [];
  for (const file of files) {
    if (file.language) languages[file.language] = (languages[file.language] ?? 0) + 1;
    if (modules.length < MAX_SUMMARY_FILES) {
      modules.push({ path: file.path, role: file.role, language: file.language });
    }
  }

  const previousDeps = Array.isArray(repo.architecture?.dependencies)
    ? (repo.architecture.dependencies as string[])
    : [];
  const nextDeps = dependencies ?? previousDeps;

  await prisma.githubRepository.update({
    where: { id: repositoryId },
    data: { lastSyncedAt: new Date(), lastIndexedSha: tree.sha },
  });

  await prisma.repoArchitecture.upsert({
    where: { repositoryId },
    create: {
      repositoryId,
      summary: `Indexed ${files.length} files on ${repo.owner}/${repo.name}.`,
      languages,
      dependencies: nextDeps,
      modules,
      sourceSha: tree.sha,
    },
    update: {
      languages,
      dependencies: nextDeps,
      modules,
      sourceSha: tree.sha,
      generatedAt: new Date(),
    },
  });

  if (!changed) {
    await maybeWriteBackgroundSummary({
      repositoryId,
      userId: repo.installation.userId,
      privateRepo: repo.private,
      owner: repo.owner,
      name: repo.name,
      files,
      currentSummary: repo.architecture?.summary ?? null,
    });
  }

  return { indexed, sha: tree.sha };
}
