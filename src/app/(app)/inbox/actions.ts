"use server";

import { ProjectRequestKind, ProjectRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireOnboardedUser } from "@/lib/current-user";
import { intersectTags } from "@/lib/match";
import { getProjectMembership } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

// ratelimit
const MAX_REQUESTS_PER_DAY = 30;
const MAX_REQUESTS_PER_BURST = 10;
const BURST_WINDOW_MS = 10 * 60 * 1000;
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type SendRequestState = {
  sent: boolean;
  error: string | null;
};

export type RespondState = {
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

function displayName(user: { fullName: string | null; username: string | null }): string {
  return user.fullName || user.username || "A KCL builder";
}

function parseKind(raw: FormDataEntryValue | null): ProjectRequestKind | null {
  if (raw === "INVITE" || raw === "JOIN") return raw;
  return null;
}

export async function sendProjectRequest(
  _previousState: SendRequestState,
  formData: FormData,
): Promise<SendRequestState> {
  const viewer = await requireOnboardedUser();
  const toUserId = getField(formData.get("toUserId"), 60);
  const projectId = getField(formData.get("projectId"), 60);
  const message = getField(formData.get("message"), 1000);
  const note = getField(formData.get("note"), 200);
  const kind = parseKind(formData.get("kind")) ?? ProjectRequestKind.INVITE;

  if (!toUserId) {
    return { sent: false, error: "We couldn't find that builder." };
  }

  if (toUserId === viewer.id) {
    return { sent: false, error: "You can't send a request to yourself." };
  }

  if (!projectId) {
    return { sent: false, error: "Pick the project this request is about." };
  }

  if (!message || message.length < 20) {
    return { sent: false, error: "Add at least 20 characters so they know why you're reaching out." };
  }

  if (viewer.profilePrivate) {
    return {
      sent: false,
      error: "Turn off private profile before sending build requests.",
    };
  }

  const [target, project] = await Promise.all([
    prisma.user.findFirst({
      where: { id: toUserId, onboarded: true },
      select: { id: true, skills: true, interests: true, profilePrivate: true },
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, status: true },
    }),
  ]);

  if (!target || target.profilePrivate) {
    return { sent: false, error: "That builder is no longer available." };
  }

  if (!project || project.status !== "ACTIVE") {
    return { sent: false, error: "That project is not open for collaboration." };
  }

  const senderMembership = await getProjectMembership(projectId, viewer.id);
  const targetMembership = await getProjectMembership(projectId, target.id);

  if (kind === ProjectRequestKind.INVITE) {
    if (!senderMembership) {
      return { sent: false, error: "You can only invite people onto builds you belong to." };
    }
    if (targetMembership) {
      return { sent: false, error: "They're already on this build." };
    }
  } else {
    if (senderMembership) {
      return { sent: false, error: "You're already on this build." };
    }
    if (!targetMembership) {
      return { sent: false, error: "Ask someone who is already on the build." };
    }
  }

  const now = Date.now();
  const [sentInDay, sentInBurst] = await Promise.all([
    prisma.projectRequest.count({
      where: { fromUserId: viewer.id, createdAt: { gte: new Date(now - DAY_WINDOW_MS) } },
    }),
    prisma.projectRequest.count({
      where: { fromUserId: viewer.id, createdAt: { gte: new Date(now - BURST_WINDOW_MS) } },
    }),
  ]);

  if (sentInBurst >= MAX_REQUESTS_PER_BURST) {
    return {
      sent: false,
      error: "You're sending these very fast. Wait a few minutes, then keep going.",
    };
  }

  if (sentInDay >= MAX_REQUESTS_PER_DAY) {
    return {
      sent: false,
      error: "You've reached today's request limit. You can send more tomorrow.",
    };
  }

  const existingPending = await prisma.projectRequest.findFirst({
    where: {
      projectId,
      status: "PENDING",
      OR: [
        { fromUserId: viewer.id, toUserId: target.id },
        { fromUserId: target.id, toUserId: viewer.id },
      ],
    },
    select: { fromUserId: true },
  });

  if (existingPending) {
    return {
      sent: false,
      error:
        existingPending.fromUserId === viewer.id
          ? "You already have a pending request on this build."
          : "This builder already sent you a request on this build — check your inbox.",
    };
  }

  const sharedSkills = intersectTags(viewer.skills, target.skills);
  const sharedInterests = intersectTags(viewer.interests, target.interests);
  const senderName = displayName(viewer);

  await prisma.$transaction(async (tx) => {
    const request = await tx.projectRequest.create({
      data: {
        fromUserId: viewer.id,
        toUserId: target.id,
        projectId,
        kind,
        message,
        note,
        sharedSkills,
        sharedInterests,
      },
    });

    await tx.notification.create({
      data: {
        userId: target.id,
        type: "REQUEST_RECEIVED",
        message:
          kind === ProjectRequestKind.INVITE
            ? `${senderName} invited you to ${project.name}.`
            : `${senderName} asked to join ${project.name}.`,
        actorName: senderName,
        requestId: request.id,
      },
    });
  });

  revalidatePath("/partners");
  revalidatePath("/inbox");
  revalidatePath(`/projects/${projectId}`);
  return { sent: true, error: null };
}

export async function respondToRequest(
  _previousState: RespondState,
  formData: FormData,
): Promise<RespondState> {
  const viewer = await requireOnboardedUser();
  const requestId = getField(formData.get("requestId"), 60);
  const decision = formData.get("decision");

  if (!requestId) {
    return { error: "Request not found." };
  }

  if (decision !== "accept" && decision !== "decline") {
    return { error: "That action isn't valid." };
  }

  const request = await prisma.projectRequest.findFirst({
    where: { id: requestId, toUserId: viewer.id, status: "PENDING" },
    select: {
      id: true,
      fromUserId: true,
      projectId: true,
      kind: true,
      project: { select: { name: true } },
    },
  });

  if (!request) {
    return { error: "This request is no longer pending." };
  }

  const responderName = displayName(viewer);

  if (decision === "decline") {
    await prisma.$transaction(async (tx) => {
      await tx.projectRequest.update({
        where: { id: request.id },
        data: { status: "DECLINED", respondedAt: new Date() },
      });

      await tx.notification.create({
        data: {
          userId: request.fromUserId,
          type: "REQUEST_DECLINED",
          message: `${responderName} declined your request on ${request.project.name}.`,
          actorName: responderName,
          requestId: request.id,
        },
      });
    });

    revalidatePath("/inbox");
    revalidatePath("/partners");
    return { error: null };
  }

  // INVITE: accepter (toUser) joins. JOIN: requester (fromUser) joins.
  const joiningUserId =
    request.kind === ProjectRequestKind.INVITE ? viewer.id : request.fromUserId;

  await prisma.$transaction(async (tx) => {
    await tx.projectRequest.update({
      where: { id: request.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });

    await tx.projectMember.upsert({
      where: {
        projectId_userId: { projectId: request.projectId, userId: joiningUserId },
      },
      update: {},
      create: {
        projectId: request.projectId,
        userId: joiningUserId,
        role: ProjectRole.MEMBER,
      },
    });

    await tx.notification.create({
      data: {
        userId: request.fromUserId,
        type: "REQUEST_ACCEPTED",
        message: `${responderName} accepted — you're on ${request.project.name} together.`,
        actorName: responderName,
        requestId: request.id,
      },
    });
  });

  revalidatePath("/inbox");
  revalidatePath("/partners");
  revalidatePath("/projects");
  revalidatePath("/home");
  revalidatePath(`/projects/${request.projectId}`);
  return { error: null };
}

export async function cancelRequest(
  _previousState: RespondState,
  formData: FormData,
): Promise<RespondState> {
  const viewer = await requireOnboardedUser();
  const requestId = getField(formData.get("requestId"), 60);

  if (!requestId) {
    return { error: "Request not found." };
  }

  const request = await prisma.projectRequest.findFirst({
    where: { id: requestId, fromUserId: viewer.id, status: "PENDING" },
    select: { id: true, projectId: true },
  });

  if (!request) {
    return { error: "This request can no longer be cancelled." };
  }

  await prisma.projectRequest.update({
    where: { id: request.id },
    data: { status: "CANCELLED", respondedAt: new Date() },
  });

  revalidatePath("/inbox");
  revalidatePath("/partners");
  revalidatePath(`/projects/${request.projectId}`);
  return { error: null };
}

export async function markNotificationsRead(): Promise<void> {
  const viewer = await requireOnboardedUser();
  await prisma.notification.updateMany({
    where: { userId: viewer.id, read: false },
    data: { read: true },
  });
  revalidatePath("/inbox");
}
