"use server";

import { ProjectRole, ProjectVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/current-user";
import { getProjectMembership } from "@/lib/project-access";
import {
  DEFAULT_SIGNATURE_STATEMENT,
  SYSTEM_UPDATE_BODIES,
} from "@/lib/proof";
import { prisma } from "@/lib/prisma";

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
    select: { body: true },
  });
  const hasRealActivity = subjectActivity.some(
    (update) => !SYSTEM_UPDATE_BODIES.has(update.body),
  );

  if (!hasRealActivity) {
    return {
      error: "They need to post a real build-log update before you can sign them.",
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
        statement: DEFAULT_SIGNATURE_STATEMENT,
        createdAt: new Date(),
      },
    });
  } else {
    await prisma.proofSignature.create({
      data: {
        projectId,
        signerId: user.id,
        subjectId,
        statement: DEFAULT_SIGNATURE_STATEMENT,
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

  await prisma.proofSignature.update({
    where: { id: signature.id },
    data: { revokedAt: new Date() },
  });

  revalidatePath(`/projects/${signature.projectId}`);
  revalidatePath("/proof");
  return { error: null, success: true };
}
