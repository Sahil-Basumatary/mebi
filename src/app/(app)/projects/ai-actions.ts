"use server";

import { AiDocumentKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { gatherRepoContext, recordLearningSignal, runProjectAi } from "@/lib/ai/run";
import { architecturePrompt, commitReviewPrompt, docsPrompt, hintPrompt } from "@/lib/ai/prompts";
import { categoriesFromFindings, parseReviewFindings } from "@/lib/ai/findings";
import { getCommit, listRecentCommits } from "@/lib/github/app";
import { inngest } from "@/inngest/client";
import { requireOnboardedUser } from "@/lib/current-user";
import { requireProjectMember } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export type AiActionState = {
  error: string | null;
  text: string | null;
};

const INITIAL: AiActionState = { error: null, text: null };

async function linkedRepo(projectId: string, userId: string) {
  await requireProjectMember(projectId, userId);
  return prisma.githubRepository.findUnique({
    where: { projectId },
    include: { installation: true },
  });
}

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
}

export async function linkGithubRepository(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const user = await requireOnboardedUser();
  const projectId = String(formData.get("projectId") ?? "");
  const repositoryId = String(formData.get("repositoryId") ?? "");
  if (!projectId || !repositoryId) {
    return { error: "Choose a repository.", text: null };
  }
  await requireProjectMember(projectId, user.id);
  const repo = await prisma.githubRepository.findFirst({
    where: { id: repositoryId, installation: { userId: user.id } },
  });
  if (!repo) {
    return { error: "That repository is not connected to your GitHub App.", text: null };
  }
  if (repo.projectId && repo.projectId !== projectId) {
    return { error: "That repository is already linked to another project.", text: null };
  }
  const current = await prisma.githubRepository.findUnique({ where: { projectId } });
  if (current && current.id !== repo.id) {
    await prisma.githubRepository.update({
      where: { id: current.id },
      data: { projectId: null },
    });
  }
  await prisma.githubRepository.update({
    where: { id: repo.id },
    data: { projectId },
  });
  await inngest.send({ name: "repo/sync.requested", data: { repositoryId: repo.id } });
  refresh(projectId);
  return { error: null, text: "Repository linked. Indexing has started." };
}

export async function unlinkGithubRepository(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const user = await requireOnboardedUser();
  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectMember(projectId, user.id);
  await prisma.githubRepository.updateMany({
    where: { projectId },
    data: { projectId: null },
  });
  refresh(projectId);
  return { error: null, text: "Repository unlinked from this project." };
}

export async function requestRepoSync(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const user = await requireOnboardedUser();
  const projectId = String(formData.get("projectId") ?? "");
  const repo = await linkedRepo(projectId, user.id);
  if (!repo) return { error: "Link a repository first.", text: null };
  await inngest.send({ name: "repo/sync.requested", data: { repositoryId: repo.id } });
  refresh(projectId);
  return { error: null, text: "Index refresh queued." };
}

export async function generateArchitectureMap(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const user = await requireOnboardedUser();
  const projectId = String(formData.get("projectId") ?? "");
  const repo = await linkedRepo(projectId, user.id);
  if (!repo) return { error: "Link a repository first.", text: null };
  if (!repo.lastSyncedAt) {
    await inngest.send({ name: "repo/sync.requested", data: { repositoryId: repo.id } });
    return { error: "Indexing is still running. Try again in a minute.", text: null };
  }
  const facts = await gatherRepoContext({ repositoryId: repo.id, userId: user.id });
  const result = await runProjectAi({
    userId: user.id,
    action: "ARCHITECTURE",
    userPrompt: architecturePrompt(facts),
    requireConsent: repo.private,
  });
  if (!result.ok || !result.text) {
    return { error: result.error ?? "Could not explain this repository.", text: null };
  }
  await prisma.repoArchitecture.updateMany({
    where: { repositoryId: repo.id },
    data: { summary: result.text.slice(0, 8000), generatedAt: new Date() },
  });
  refresh(projectId);
  return { error: null, text: result.text };
}

export async function reviewProjectCommit(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const user = await requireOnboardedUser();
  const projectId = String(formData.get("projectId") ?? "");
  const shaInput = String(formData.get("sha") ?? "").trim();
  const repo = await linkedRepo(projectId, user.id);
  if (!repo) return { error: "Link a repository first.", text: null };
  let sha = shaInput;
  if (!sha) {
    const recent = await listRecentCommits(
      repo.installation.installationId,
      repo.owner,
      repo.name,
      repo.defaultBranch,
    );
    sha = recent[0]?.sha ?? "";
  }
  if (!sha) return { error: "Provide a commit SHA.", text: null };
  const commit = await getCommit(repo.installation.installationId, repo.owner, repo.name, sha);
  const diff = (commit.files ?? [])
    .slice(0, 20)
    .map((file) => `${file.filename}\n${file.patch ?? ""}`)
    .join("\n\n")
    .slice(0, 16_000);
  const facts = await gatherRepoContext({ repositoryId: repo.id, userId: user.id, extra: diff });
  const result = await runProjectAi({
    userId: user.id,
    action: "COMMIT_REVIEW",
    userPrompt: commitReviewPrompt({
      message: commit.commit.message,
      diff,
      facts,
    }),
    requireConsent: repo.private,
  });
  if (!result.ok || !result.text) {
    return { error: result.error ?? "Could not review that commit.", text: null };
  }
  const findings = parseReviewFindings(result.text);
  await prisma.repoCommitReview.upsert({
    where: { repositoryId_sha: { repositoryId: repo.id, sha: commit.sha } },
    create: {
      repositoryId: repo.id,
      userId: user.id,
      sha: commit.sha,
      title: commit.commit.message.split("\n")[0]?.slice(0, 180) || commit.sha.slice(0, 8),
      body: result.text.slice(0, 12_000),
      findings,
    },
    update: { body: result.text.slice(0, 12_000), findings, title: commit.commit.message.split("\n")[0]?.slice(0, 180) || commit.sha.slice(0, 8) },
  });
  for (const category of categoriesFromFindings(findings)) {
    await recordLearningSignal(user.id, category, `Seen in ${commit.sha.slice(0, 8)}`);
  }
  refresh(projectId);
  return { error: null, text: result.text };
}

export async function requestProjectHint(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const user = await requireOnboardedUser();
  const projectId = String(formData.get("projectId") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const stronger = formData.get("stronger") === "1";
  if (question.length < 8) {
    return { error: "Ask a specific question about your project.", text: null };
  }
  const repo = await linkedRepo(projectId, user.id);
  if (!repo) return { error: "Link a repository first.", text: null };
  const previous = await prisma.aiHintSession.findFirst({
    where: { projectId, userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { ladderStep: true },
  });
  const ladderStep = stronger ? Math.min(3, (previous?.ladderStep ?? 1) + 1) : 1;
  const facts = await gatherRepoContext({ repositoryId: repo.id, userId: user.id });
  const mistakes = await prisma.learningMistake.findMany({
    where: { userId: user.id },
    select: { category: true, detail: true, count: true },
    take: 12,
  });
  const result = await runProjectAi({
    userId: user.id,
    action: "HINT",
    userPrompt: hintPrompt({
      question,
      step: ladderStep,
      mistakes: mistakes.map((row) => `${row.category} x${row.count}: ${row.detail}`).join("\n"),
      facts,
    }),
    requireConsent: repo.private,
  });
  if (!result.ok || !result.text) {
    return { error: result.error ?? "Could not write a hint.", text: null };
  }
  await prisma.aiHintSession.create({
    data: {
      userId: user.id,
      projectId,
      repositoryId: repo.id,
      prompt: question.slice(0, 2000),
      response: result.text.slice(0, 8000),
      ladderStep,
    },
  });
  refresh(projectId);
  return { error: null, text: result.text };
}

export async function draftProjectDocument(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const user = await requireOnboardedUser();
  const projectId = String(formData.get("projectId") ?? "");
  const kindRaw = String(formData.get("kind") ?? "README");
  const kind: AiDocumentKind =
    kindRaw === "ADR" || kindRaw === "ARCHITECTURE" ? kindRaw : "README";
  const repo = await linkedRepo(projectId, user.id);
  if (!repo) return { error: "Link a repository first.", text: null };
  const facts = await gatherRepoContext({ repositoryId: repo.id, userId: user.id });
  const result = await runProjectAi({
    userId: user.id,
    action: "DOCS",
    userPrompt: docsPrompt(kind, facts),
    requireConsent: repo.private,
  });
  if (!result.ok || !result.text) {
    return { error: result.error ?? "Could not draft that document.", text: null };
  }
  const title =
    kind === "README" ? "README draft" : kind === "ADR" ? "ADR draft" : "Architecture note";
  await prisma.aiDocumentDraft.create({
    data: {
      userId: user.id,
      projectId,
      repositoryId: repo.id,
      kind,
      title,
      body: result.text.slice(0, 16_000),
    },
  });
  refresh(projectId);
  return { error: null, text: result.text };
}

export async function loadRecentProjectCommits(projectId: string): Promise<
  | { error: string; commits: Array<{ sha: string; message: string }> }
  | { error: null; commits: Array<{ sha: string; message: string }> }
> {
  const user = await requireOnboardedUser();
  const repo = await linkedRepo(projectId, user.id);
  if (!repo) return { error: "Link a repository first.", commits: [] };
  const commits = await listRecentCommits(
    repo.installation.installationId,
    repo.owner,
    repo.name,
    repo.defaultBranch,
  );
  return { error: null, commits };
}

export { INITIAL as emptyAiActionState };
