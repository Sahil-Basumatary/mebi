"use server";

import { ProjectVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/current-user";
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

function parseProgress(rawValue: FormDataEntryValue | null): number {
  if (typeof rawValue !== "string") {
    return 0;
  }

  const value = Number.parseInt(rawValue, 10);
  if (Number.isNaN(value)) {
    return 0;
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
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectProgress(
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const user = await requireOnboardedUser();
  const projectId = getField(formData.get("projectId"), 80);
  const progress = parseProgress(formData.get("progress"));

  if (!projectId) {
    return { error: "Project not found." };
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: user.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!project) {
    return { error: "You can only update your own projects." };
  }

  if (project.status === "COMPLETED") {
    return { error: "Completed projects stay locked at 100%." };
  }

  await prisma.project.update({
    where: { id: project.id },
    data: { progress },
  });

  revalidatePath("/dashboard");
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

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    return { completed: false, error: "You can only complete your own projects." };
  }

  await prisma.project.update({
    where: { id: project.id },
    data: {
      progress: 100,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  return { completed: true, error: null };
}
