import "server-only";

import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotifyDb = Prisma.TransactionClient | typeof prisma;

const INBOX_TYPES = new Set<NotificationType>([
  "REQUEST_RECEIVED",
  "REQUEST_ACCEPTED",
  "REQUEST_DECLINED",
]);

const PROJECT_TYPES = new Set<NotificationType>(["PROJECT_UPDATE", "PROJECT_SIGNED"]);

type NotifyInput = {
  userId: string;
  type: NotificationType;
  message: string;
  actorName?: string | null;
  requestId?: string | null;
  href?: string | null;
};

export async function createNotification(db: NotifyDb, input: NotifyInput): Promise<void> {
  const prefs = await db.user.findUnique({
    where: { id: input.userId },
    select: { notifyInbox: true, notifyProjectActivity: true },
  });
  if (!prefs) return;
  if (INBOX_TYPES.has(input.type) && !prefs.notifyInbox) return;
  if (PROJECT_TYPES.has(input.type) && !prefs.notifyProjectActivity) return;

  await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message.slice(0, 280),
      actorName: input.actorName ?? null,
      requestId: input.requestId ?? null,
      href: input.href ?? null,
    },
  });
}

export async function notifyProjectMembers(
  db: NotifyDb,
  input: {
    projectId: string;
    exceptUserId: string;
    type: Extract<NotificationType, "PROJECT_UPDATE" | "PROJECT_SIGNED">;
    message: string;
    actorName: string;
    href: string;
  },
): Promise<void> {
  const members = await db.projectMember.findMany({
    where: {
      projectId: input.projectId,
      userId: { not: input.exceptUserId },
      user: { notifyProjectActivity: true },
    },
    select: { userId: true },
  });
  for (const member of members) {
    await db.notification.create({
      data: {
        userId: member.userId,
        type: input.type,
        message: input.message.slice(0, 280),
        actorName: input.actorName,
        href: input.href,
      },
    });
  }
}
