"use server";

import { randomBytes } from "node:crypto";
import { ProjectRole, ProjectVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/current-user";
import { getProjectMembership } from "@/lib/project-access";
import {
  DEFAULT_SIGNATURE_STATEMENT,
  evaluateContribution,
  isProjectVerified,
  MAX_ATTESTATION_CHARS,
  MIN_ATTESTATION_CHARS,
} from "@/lib/proof";
import { prisma } from "@/lib/prisma";
import { slugify, withSlugSuffix } from "@/lib/slug";

export type ProjectFormState = {
  error: string | null;
};

export type CompleteProjectState = {
  completed: boolean;
  error: string | null;
};

export type SignatureState = {
  error: string | null;
  success: boolean;
};

function getField(rawValue: FormDataEntryValue | null, maxLength: number): string | null {
  if (typeof rawValue !== "string") {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function parseTags(rawValue: FormDataEntryValue | null): string[] {
  if (typeof rawValue !== "string") {
    return [];
  }

  return [...new Set(rawValue.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 12);
}

function isSlugConflict(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { code?: unknown; meta?: { target?: unknown } };
  if (candidate.code !== "P2002") {
    return false;
  }

  const target = candidate.meta?.target;
  const asText = Array.isArray(target) ? target.join(",") : String(target ?? "");
  return asText.includes("slug");
}

function parseOptionalProgress(rawValue: FormDataEntryValue | null): number | null {
  if (typeof rawValue !== "string" || rawValue.trim() === "") {
    return null;
  }

  const value = Number.parseInt(rawValue, 10);
  if (Number.isNaN(value)) {
    return null;
  }

  return Math.min(Math.max(value, 0), 100);
}

export async function createProject(
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const user = await requireOnboardedUser();
  const name = getField(formData.get("name"), 120);
  const description = getField(formData.get("description"), 1200);
  const estimatedTime = getField(formData.get("estimatedTime"), 80);
  const techStack = parseTags(formData.get("techStack"));
  const visibilityValue = formData.get("visibility");
  const visibility = visibilityValue === "PRIVATE" ? ProjectVisibility.PRIVATE : ProjectVisibility.PUBLIC;

  if (!name) {
    return { error: "Give the project a clear name." };
  }

  if (!description || description.length < 40) {
    return { error: "Write at least 40 characters so future partners understand the build." };
  }

  const project = await prisma.project.create({
    data: {
      ownerId: user.id,
      name,
      description,
      estimatedTime,
      techStack,
      visibility,
      members: {
        create: {
          userId: user.id,
          role: ProjectRole.OWNER,
        },
      },
      updates: {
        create: {
          authorId: user.id,
          body: "Opened the project brief.",
          progress: 0,
        },
      },
    },
  });

  revalidatePath("/home");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function postProjectUpdate(
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const user = await requireOnboardedUser();
  const projectId = getField(formData.get("projectId"), 80);
  const body = getField(formData.get("body"), 2000);
  const progress = parseOptionalProgress(formData.get("progress"));

  if (!projectId) {
    return { error: "Project not found." };
  }

  if (!body || body.length < 12) {
    return { error: "Write at least 12 characters about what you shipped." };
  }

  const membership = await getProjectMembership(projectId, user.id);
  if (!membership) {
    return { error: "You can only post on builds you belong to." };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, status: true, progress: true },
  });

  if (!project) {
    return { error: "Project not found." };
  }

  if (project.status === "COMPLETED") {
    return { error: "Completed projects are locked — no new updates." };
  }

  if (progress !== null && progress < project.progress) {
    return { error: "Progress can only move forward." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectUpdate.create({
      data: {
        projectId: project.id,
        authorId: user.id,
        body,
        progress,
      },
    });

    if (progress !== null) {
      await tx.project.update({
        where: { id: project.id },
        data: { progress },
      });
    }
  });

  revalidatePath("/home");
  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  return { error: null };
}

export async function markProjectComplete(
  _previousState: CompleteProjectState,
  formData: FormData,
): Promise<CompleteProjectState> {
  const user = await requireOnboardedUser();
  const projectId = getField(formData.get("projectId"), 80);

  if (!projectId) {
    return { completed: false, error: "Project not found." };
  }

  const membership = await getProjectMembership(projectId, user.id);
  if (!membership || membership.role !== ProjectRole.OWNER) {
    return { completed: false, error: "Only the project owner can mark it complete." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: {
        progress: 100,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await tx.projectUpdate.create({
      data: {
        projectId,
        authorId: user.id,
        body: "Marked the project complete.",
        progress: 100,
      },
    });
  });

  revalidatePath("/home");
  revalidatePath("/projects");
  revalidatePath("/proof");
  revalidatePath(`/projects/${projectId}`);
  return { completed: true, error: null };
}

export async function signProofContribution(
  _previousState: SignatureState,
  formData: FormData,
): Promise<SignatureState> {
  const user = await requireOnboardedUser();
  const projectId = getField(formData.get("projectId"), 80);
  const subjectId = getField(formData.get("subjectId"), 80);
  const consented = formData.get("consent") === "on" || formData.get("consent") === "true";

  if (!projectId || !subjectId) {
    return { error: "Missing project or teammate.", success: false };
  }

  if (subjectId === user.id) {
    return { error: "You can't sign your own contribution.", success: false };
  }

  if (!consented) {
    return {
      error: "Confirm the statement — signing is also consent to publish their name on this proof.",
      success: false,
    };
  }

  const [signerMembership, subjectMembership] = await Promise.all([
    getProjectMembership(projectId, user.id),
    getProjectMembership(projectId, subjectId),
  ]);

  if (!signerMembership || !subjectMembership) {
    return { error: "Both people must be on this build.", success: false };
  }

  const subjectActivity = await prisma.projectUpdate.findMany({
    where: { projectId, authorId: subjectId },
    select: { body: true, createdAt: true },
  });
  const contribution = evaluateContribution(subjectActivity);

  if (!contribution.ok) {
    return {
      error: contribution.reason ?? "They need more substantive build-log activity before you can sign them.",
      success: false,
    };
  }

  const statement = getField(formData.get("statement"), MAX_ATTESTATION_CHARS);
  if (!statement || statement.length < MIN_ATTESTATION_CHARS) {
    return {
      error: `Write at least ${MIN_ATTESTATION_CHARS} characters describing what they contributed.`,
      success: false,
    };
  }
  if (statement === DEFAULT_SIGNATURE_STATEMENT) {
    return {
      error: "Write your own attestation — the default boilerplate does not count.",
      success: false,
    };
  }

  const existing = await prisma.proofSignature.findUnique({
    where: {
      projectId_signerId_subjectId: {
        projectId,
        signerId: user.id,
        subjectId,
      },
    },
  });

  if (existing && !existing.revokedAt) {
    return { error: "You already signed this teammate on this build.", success: false };
  }

  if (existing?.revokedAt) {
    await prisma.proofSignature.update({
      where: { id: existing.id },
      data: {
        revokedAt: null,
        statement,
        createdAt: new Date(),
      },
    });
  } else {
    await prisma.proofSignature.create({
      data: {
        projectId,
        signerId: user.id,
        subjectId,
        statement,
      },
    });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/proof");
  return { error: null, success: true };
}

export async function revokeProofSignature(
  _previousState: SignatureState,
  formData: FormData,
): Promise<SignatureState> {
  const user = await requireOnboardedUser();
  const signatureId = getField(formData.get("signatureId"), 80);

  if (!signatureId) {
    return { error: "Signature not found.", success: false };
  }

  const signature = await prisma.proofSignature.findFirst({
    where: { id: signatureId, signerId: user.id, revokedAt: null },
    select: { id: true, projectId: true },
  });

  if (!signature) {
    return { error: "You can only revoke your own active signatures.", success: false };
  }

  // A published page asserts the verification bar it was published under, so
  // pulling a signature has to pull the public proof down with it.
  const retracted = await prisma.$transaction(async (tx) => {
    await tx.proofSignature.update({
      where: { id: signature.id },
      data: { revokedAt: new Date() },
    });

    const project = await tx.project.findUnique({
      where: { id: signature.projectId },
      select: {
        slug: true,
        publishedAt: true,
        members: { select: { userId: true, user: { select: { username: true } } } },
        signatures: {
          where: { revokedAt: null },
          select: { signerId: true, subjectId: true, revokedAt: true },
        },
      },
    });

    if (!project?.publishedAt) {
      return null;
    }

    const memberIds = project.members.map((member) => member.userId);
    if (memberIds.length === 1 || isProjectVerified(memberIds, project.signatures)) {
      return null;
    }

    await tx.project.update({
      where: { id: signature.projectId },
      data: { publishedAt: null },
    });

    return {
      slug: project.slug,
      usernames: project.members
        .map((member) => member.user.username)
        .filter((username): username is string => Boolean(username)),
    };
  });

  revalidatePath(`/projects/${signature.projectId}`);
  revalidatePath("/proof");

  if (retracted) {
    if (retracted.slug) {
      revalidatePath(`/b/${retracted.slug}`);
    }
    for (const username of retracted.usernames) {
      revalidatePath(`/u/${username}`);
    }
  }

  return { error: null, success: true };
}

export type PublishState = {
  error: string | null;
  status: "idle" | "published" | "unpublished";
  slug: string | null;
};

export async function publishProject(
  _previousState: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const user = await requireOnboardedUser();
  const projectId = getField(formData.get("projectId"), 80);
  const summary = getField(formData.get("summary"), 280);

  if (!projectId) {
    return { error: "Project not found.", status: "idle", slug: null };
  }

  const membership = await getProjectMembership(projectId, user.id);
  if (!membership || membership.role !== ProjectRole.OWNER) {
    return { error: "Only the owner can publish this build.", status: "idle", slug: null };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { select: { userId: true } },
      signatures: {
        where: { revokedAt: null },
        select: { signerId: true, subjectId: true, revokedAt: true },
      },
    },
  });

  if (!project) {
    return { error: "Project not found.", status: "idle", slug: null };
  }

  if (project.status !== "COMPLETED") {
    return { error: "Finish the project before publishing proof.", status: "idle", slug: null };
  }

  if (project.visibility !== ProjectVisibility.PUBLIC) {
    return {
      error: "Switch the project to public visibility before publishing.",
      status: "idle",
      slug: null,
    };
  }

  const memberIds = project.members.map((member) => member.userId);
  const verified = isProjectVerified(memberIds, project.signatures);
  const soloSelfAttested = memberIds.length === 1 && memberIds[0] === user.id;

  if (!verified && !soloSelfAttested) {
    return {
      error: "Get peer signatures from every teammate before publishing, or build solo.",
      status: "idle",
      slug: null,
    };
  }

  const base = slugify(project.name);
  const publicSummary = summary ?? project.description.slice(0, 280);

  // The unique index is the arbiter, not a prior availability check: two people
  // publishing similarly named builds at once would both pass a read.
  let published: { slug: string | null } | null = null;
  for (let attempt = 0; attempt < 6 && !published; attempt += 1) {
    const candidate =
      project.slug ??
      (attempt === 0 ? base : withSlugSuffix(base, randomBytes(3).toString("hex")));

    try {
      published = await prisma.project.update({
        where: { id: project.id },
        data: {
          slug: candidate,
          summary: publicSummary,
          publishedAt: new Date(),
        },
        select: { slug: true },
      });
    } catch (error) {
      if (project.slug || !isSlugConflict(error)) {
        throw error;
      }
    }
  }

  if (!published) {
    return {
      error: "That build name is heavily contested right now. Rename it and try again.",
      status: "idle",
      slug: null,
    };
  }

  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/proof");
  if (published.slug) {
    revalidatePath(`/b/${published.slug}`);
  }
  if (user.username) {
    revalidatePath(`/u/${user.username}`);
  }

  return { error: null, status: "published", slug: published.slug };
}

export async function unpublishProject(
  _previousState: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const user = await requireOnboardedUser();
  const projectId = getField(formData.get("projectId"), 80);

  if (!projectId) {
    return { error: "Project not found.", status: "idle", slug: null };
  }

  const membership = await getProjectMembership(projectId, user.id);
  if (!membership || membership.role !== ProjectRole.OWNER) {
    return { error: "Only the owner can unpublish this build.", status: "idle", slug: null };
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { publishedAt: null },
    select: { slug: true },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/proof");
  if (project.slug) {
    revalidatePath(`/b/${project.slug}`);
  }
  if (user.username) {
    revalidatePath(`/u/${user.username}`);
  }

  return { error: null, status: "unpublished", slug: project.slug };
}

export type LifecycleState = {
  error: string | null;
  success: boolean;
};

async function retractIfUnverified(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      slug: true,
      publishedAt: true,
      members: { select: { userId: true, user: { select: { username: true } } } },
      signatures: {
        where: { revokedAt: null },
        select: { signerId: true, subjectId: true, revokedAt: true },
      },
    },
  });

  if (!project?.publishedAt) return null;

  const memberIds = project.members.map((member) => member.userId);
  if (memberIds.length === 1 || isProjectVerified(memberIds, project.signatures)) {
    return null;
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { publishedAt: null },
  });

  return {
    slug: project.slug,
    usernames: project.members
      .map((member) => member.user.username)
      .filter((username): username is string => Boolean(username)),
  };
}

export async function updateProject(
  _previousState: LifecycleState,
  formData: FormData,
): Promise<LifecycleState> {
  const user = await requireOnboardedUser();
  const projectId = getField(formData.get("projectId"), 80);
  const name = getField(formData.get("name"), 120);
  const description = getField(formData.get("description"), 1200);
  const estimatedTime = getField(formData.get("estimatedTime"), 80);
  const techStack = parseTags(formData.get("techStack"));
  const visibilityValue = formData.get("visibility");
  const visibility =
    visibilityValue === "PRIVATE" ? ProjectVisibility.PRIVATE : ProjectVisibility.PUBLIC;

  if (!projectId) return { error: "Project not found.", success: false };

  const membership = await getProjectMembership(projectId, user.id);
  if (!membership || membership.role !== ProjectRole.OWNER) {
    return { error: "Only the owner can edit this brief.", success: false };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true, publishedAt: true, slug: true },
  });
  if (!project) return { error: "Project not found.", success: false };
  if (project.status === "COMPLETED") {
    return { error: "Finished builds lock the brief. Unpublish stays available.", success: false };
  }
  if (!name) return { error: "Give the project a clear name.", success: false };
  if (!description || description.length < 40) {
    return { error: "Write at least 40 characters so partners understand the build.", success: false };
  }

  const shouldUnpublish =
    visibility === ProjectVisibility.PRIVATE && Boolean(project.publishedAt);

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name,
      description,
      estimatedTime,
      techStack,
      visibility,
      ...(shouldUnpublish ? { publishedAt: null } : {}),
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/discover");
  if (shouldUnpublish && project.slug) {
    revalidatePath(`/b/${project.slug}`);
    revalidatePath("/proof");
  }
  return { error: null, success: true };
}

export async function deleteProject(
  _previousState: LifecycleState,
  formData: FormData,
): Promise<LifecycleState> {
  const user = await requireOnboardedUser();
  const projectId = getField(formData.get("projectId"), 80);
  if (!projectId) return { error: "Project not found.", success: false };

  const membership = await getProjectMembership(projectId, user.id);
  if (!membership || membership.role !== ProjectRole.OWNER) {
    return { error: "Only the owner can delete this project.", success: false };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      slug: true,
      members: { select: { user: { select: { username: true } } } },
    },
  });
  if (!project) return { error: "Project not found.", success: false };

  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/projects");
  revalidatePath("/home");
  revalidatePath("/proof");
  revalidatePath("/discover");
  if (project.slug) revalidatePath(`/b/${project.slug}`);
  for (const member of project.members) {
    if (member.user.username) revalidatePath(`/u/${member.user.username}`);
  }
  redirect("/projects");
}

export async function leaveProject(
  _previousState: LifecycleState,
  formData: FormData,
): Promise<LifecycleState> {
  const user = await requireOnboardedUser();
  const projectId = getField(formData.get("projectId"), 80);
  if (!projectId) return { error: "Project not found.", success: false };

  const membership = await getProjectMembership(projectId, user.id);
  if (!membership) return { error: "You are not on this build.", success: false };

  if (membership.role === ProjectRole.OWNER) {
    const others = await prisma.projectMember.count({
      where: { projectId, userId: { not: user.id } },
    });
    if (others > 0) {
      return {
        error: "Transfer ownership before leaving, or delete the project.",
        success: false,
      };
    }
    await prisma.project.delete({ where: { id: projectId } });
    revalidatePath("/projects");
    revalidatePath("/home");
    revalidatePath("/discover");
    redirect("/projects");
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  await prisma.proofSignature.updateMany({
    where: {
      projectId,
      revokedAt: null,
      OR: [{ signerId: user.id }, { subjectId: user.id }],
    },
    data: { revokedAt: new Date() },
  });

  const retracted = await retractIfUnverified(projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/proof");
  if (retracted?.slug) revalidatePath(`/b/${retracted.slug}`);
  for (const username of retracted?.usernames ?? []) {
    revalidatePath(`/u/${username}`);
  }
  if (user.username) revalidatePath(`/u/${user.username}`);
  redirect("/projects");
}

export async function removeMember(
  _previousState: LifecycleState,
  formData: FormData,
): Promise<LifecycleState> {
  const user = await requireOnboardedUser();
  const projectId = getField(formData.get("projectId"), 80);
  const memberUserId = getField(formData.get("memberUserId"), 80);
  if (!projectId || !memberUserId) {
    return { error: "Missing project or member.", success: false };
  }
  if (memberUserId === user.id) {
    return { error: "Use leave project to remove yourself.", success: false };
  }

  const membership = await getProjectMembership(projectId, user.id);
  if (!membership || membership.role !== ProjectRole.OWNER) {
    return { error: "Only the owner can remove members.", success: false };
  }

  const target = await getProjectMembership(projectId, memberUserId);
  if (!target) return { error: "That person is not on this build.", success: false };
  if (target.role === ProjectRole.OWNER) {
    return { error: "Transfer ownership before removing the owner.", success: false };
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: memberUserId } },
  });
  await prisma.proofSignature.updateMany({
    where: {
      projectId,
      revokedAt: null,
      OR: [{ signerId: memberUserId }, { subjectId: memberUserId }],
    },
    data: { revokedAt: new Date() },
  });

  const retracted = await retractIfUnverified(projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/proof");
  if (retracted?.slug) revalidatePath(`/b/${retracted.slug}`);
  for (const username of retracted?.usernames ?? []) {
    revalidatePath(`/u/${username}`);
  }
  return { error: null, success: true };
}

export async function transferOwnership(
  _previousState: LifecycleState,
  formData: FormData,
): Promise<LifecycleState> {
  const user = await requireOnboardedUser();
  const projectId = getField(formData.get("projectId"), 80);
  const nextOwnerId = getField(formData.get("nextOwnerId"), 80);
  if (!projectId || !nextOwnerId) {
    return { error: "Pick a teammate to transfer to.", success: false };
  }
  if (nextOwnerId === user.id) {
    return { error: "You already own this build.", success: false };
  }

  const membership = await getProjectMembership(projectId, user.id);
  if (!membership || membership.role !== ProjectRole.OWNER) {
    return { error: "Only the owner can transfer ownership.", success: false };
  }

  const next = await getProjectMembership(projectId, nextOwnerId);
  if (!next) return { error: "That person must already be on the roster.", success: false };

  await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: { ownerId: nextOwnerId },
    }),
    prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: nextOwnerId } },
      data: { role: ProjectRole.OWNER },
    }),
    prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: user.id } },
      data: { role: ProjectRole.MEMBER },
    }),
  ]);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { error: null, success: true };
}
