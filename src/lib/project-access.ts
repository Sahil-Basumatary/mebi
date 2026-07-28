import { ProjectRole, type Project, type ProjectMember } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type ProjectWithMembership = Project & {
  membership: ProjectMember;
};

export function memberProjectWhere(userId: string) {
  return {
    members: {
      some: { userId },
    },
  } as const;
}

export async function getProjectMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });
}

export async function requireProjectMember(
  projectId: string,
  userId: string,
): Promise<ProjectWithMembership> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId },
        take: 1,
      },
    },
  });

  const membership = project?.members[0];
  if (!project || !membership) {
    notFound();
  }

  const { members, ...rest } = project;
  void members;
  return { ...rest, membership };
}

export async function requireProjectOwner(
  projectId: string,
  userId: string,
): Promise<ProjectWithMembership> {
  const project = await requireProjectMember(projectId, userId);
  if (project.membership.role !== ProjectRole.OWNER) {
    notFound();
  }
  return project;
}
