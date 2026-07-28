"use server";

import { ProjectRole, ProjectVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/current-user";
import { getProjectMembership } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export type ProjectFormState = {
  error: string | null;
};

export type CompleteProjectState = {
  completed: boolean;
  error: string | null;
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
