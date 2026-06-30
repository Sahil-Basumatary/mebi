"use server";

import { revalidatePath } from "next/cache";
import { requireOnboardedUser } from "@/lib/current-user";
import { intersectTags } from "@/lib/match";
import { prisma } from "@/lib/prisma";

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

// Partnerships are undirected, so we always store the lower id first. That keeps
// the (userAId, userBId) unique constraint meaningful no matter who accepted.
function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function displayName(user: { fullName: string | null; username: string | null }): string {
  return user.fullName || user.username || "A KCL builder";
}

export async function sendPartnershipRequest(
  _previousState: SendRequestState,
  formData: FormData,
): Promise<SendRequestState> {
  const viewer = await requireOnboardedUser();
  const toUserId = getField(formData.get("toUserId"), 60);
  const message = getField(formData.get("message"), 1000);
  const projectInterest = getField(formData.get("projectInterest"), 200);
  const relatedProjectId = getField(formData.get("relatedProjectId"), 60);

  if (!toUserId) {
    return { sent: false, error: "We couldn't find that builder." };
  }

  if (toUserId === viewer.id) {
    return { sent: false, error: "You can't send a request to yourself." };
  }

  if (!message || message.length < 20) {
    return { sent: false, error: "Add at least 20 characters so they know why you're reaching out." };
  }

  const target = await prisma.user.findFirst({
    where: { id: toUserId, onboarded: true },
    select: { id: true, skills: true, interests: true },
  });

  if (!target) {
    return { sent: false, error: "That builder is no longer available." };
  }

  const [userAId, userBId] = orderedPair(viewer.id, target.id);
  const existingPartnership = await prisma.partnership.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
    select: { id: true },
  });

  if (existingPartnership) {
    return { sent: false, error: "You're already partnered with this builder." };
  }

  const existingPending = await prisma.partnershipRequest.findFirst({
    where: {
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
          ? "You already have a pending request with this builder."
          : "This builder already sent you a request — check your inbox.",
    };
  }

  // Only attach a project the sender actually owns, so the link can't be spoofed.
  let validProjectId: string | null = null;
  if (relatedProjectId) {
    const owned = await prisma.project.findFirst({
      where: { id: relatedProjectId, ownerId: viewer.id },
      select: { id: true },
    });
    validProjectId = owned?.id ?? null;
  }

  const sharedSkills = intersectTags(viewer.skills, target.skills);
  const sharedInterests = intersectTags(viewer.interests, target.interests);
  const senderName = displayName(viewer);

  await prisma.$transaction(async (tx) => {
    const request = await tx.partnershipRequest.create({
      data: {
        fromUserId: viewer.id,
        toUserId: target.id,
        message,
        sharedSkills,
        sharedInterests,
        projectInterest,
        relatedProjectId: validProjectId,
      },
    });

    await tx.notification.create({
      data: {
        userId: target.id,
        type: "REQUEST_RECEIVED",
        message: `${senderName} wants to build with you.`,
        actorName: senderName,
        requestId: request.id,
      },
    });
  });

  revalidatePath("/partners");
  revalidatePath("/inbox");
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

  const request = await prisma.partnershipRequest.findFirst({
    where: { id: requestId, toUserId: viewer.id, status: "PENDING" },
    select: { id: true, fromUserId: true },
  });

  if (!request) {
    return { error: "This request is no longer pending." };
  }

  const responderName = displayName(viewer);

  if (decision === "decline") {
    await prisma.$transaction(async (tx) => {
      await tx.partnershipRequest.update({
        where: { id: request.id },
        data: { status: "DECLINED", respondedAt: new Date() },
      });

      await tx.notification.create({
        data: {
          userId: request.fromUserId,
          type: "REQUEST_DECLINED",
          message: `${responderName} declined your partnership request.`,
          actorName: responderName,
          requestId: request.id,
        },
      });
    });

    revalidatePath("/inbox");
    revalidatePath("/partners");
    return { error: null };
  }

  const [userAId, userBId] = orderedPair(viewer.id, request.fromUserId);

  await prisma.$transaction(async (tx) => {
    await tx.partnershipRequest.update({
      where: { id: request.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });

    await tx.partnership.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: {},
      create: { userAId, userBId, sourceRequestId: request.id },
    });

    await tx.notification.create({
      data: {
        userId: request.fromUserId,
        type: "REQUEST_ACCEPTED",
        message: `${responderName} accepted your request — you're partners now.`,
        actorName: responderName,
        requestId: request.id,
      },
    });
  });

  revalidatePath("/inbox");
  revalidatePath("/partners");
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

  const request = await prisma.partnershipRequest.findFirst({
    where: { id: requestId, fromUserId: viewer.id, status: "PENDING" },
    select: { id: true },
  });

  if (!request) {
    return { error: "This request can no longer be cancelled." };
  }

  await prisma.partnershipRequest.update({
    where: { id: request.id },
    data: { status: "CANCELLED", respondedAt: new Date() },
  });

  revalidatePath("/inbox");
  revalidatePath("/partners");
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
