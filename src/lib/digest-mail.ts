import "server-only";

import { appOrigin } from "@/lib/app-origin";
import { emailOptOutToken } from "@/lib/email-optout";
import { sendResendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";

const BATCH = 80;
const MIN_GAP_MS = 6 * 24 * 60 * 60 * 1000;

function mailReady(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim());
}

export async function sendWeeklyDigests(): Promise<{
  skipped: boolean;
  reason: string | null;
  sent: number;
}> {
  if (!mailReady()) {
    return { skipped: true, reason: "resend_unconfigured", sent: 0 };
  }

  const cutoff = new Date(Date.now() - MIN_GAP_MS);
  const users = await prisma.user.findMany({
    where: {
      onboarded: true,
      notifyWeeklyDigest: true,
      OR: [{ lastDigestAt: null }, { lastDigestAt: { lt: cutoff } }],
    },
    select: { id: true, email: true, fullName: true, username: true },
    take: BATCH,
  });
  if (users.length === 0) {
    return { skipped: false, reason: null, sent: 0 };
  }

  const ids = users.map((user) => user.id);
  const [pending, unread] = await Promise.all([
    prisma.projectRequest.groupBy({
      by: ["toUserId"],
      where: { toUserId: { in: ids }, status: "PENDING" },
      _count: { _all: true },
    }),
    prisma.notification.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, read: false },
      _count: { _all: true },
    }),
  ]);
  const pendingByUser = new Map(pending.map((row) => [row.toUserId, row._count._all]));
  const unreadByUser = new Map(unread.map((row) => [row.userId, row._count._all]));
  const origin = appOrigin();
  let sent = 0;

  for (const user of users) {
    const token = emailOptOutToken(user.id, "digest");
    const unsub =
      origin && token ? `${origin}/api/email/opt-out?u=${user.id}&k=digest&t=${token}` : null;
    const waiting = pendingByUser.get(user.id) ?? 0;
    const activity = unreadByUser.get(user.id) ?? 0;
    const home = origin ? `${origin}/home` : "Hackollab";
    const lines = [
      `Hi ${displayName(user.fullName, user.username)},`,
      "",
      "Your week on Hackollab:",
      `- ${waiting} pending request${waiting === 1 ? "" : "s"}`,
      `- ${activity} unread activit${activity === 1 ? "y item" : "y items"}`,
      "",
      `Open the product: ${home}`,
    ];
    if (unsub) {
      lines.push("", `Turn off this weekly email: ${unsub}`);
    } else {
      lines.push("", "Turn this off in Settings → Notifications.");
    }

    const result = await sendResendEmail({
      to: user.email,
      subject: "Your Hackollab week",
      text: lines.join("\n"),
      headers: unsub
        ? {
            "List-Unsubscribe": `<${unsub}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined,
    });
    if (!result.sent) continue;
    await prisma.user.update({
      where: { id: user.id },
      data: { lastDigestAt: new Date() },
    });
    sent += 1;
  }

  return { skipped: false, reason: null, sent };
}

export async function sendProductUpdate(
  subject: string,
  text: string,
): Promise<{
  skipped: boolean;
  reason: string | null;
  sent: number;
}> {
  if (!mailReady()) {
    return { skipped: true, reason: "resend_unconfigured", sent: 0 };
  }

  const [users, waitlist] = await Promise.all([
    prisma.user.findMany({
      where: { onboarded: true, notifyMarketing: true },
      select: { id: true, email: true, fullName: true },
      take: BATCH,
    }),
    prisma.newsletterSignup.findMany({
      where: { unsubscribedAt: null },
      select: { email: true, firstName: true, unsubscribeToken: true },
      take: BATCH,
    }),
  ]);

  const origin = appOrigin();
  const seen = new Set<string>();
  let sent = 0;

  for (const user of users) {
    const email = user.email.toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const token = emailOptOutToken(user.id, "marketing");
    const unsub =
      origin && token ? `${origin}/api/email/opt-out?u=${user.id}&k=marketing&t=${token}` : null;
    const result = await sendResendEmail({
      to: user.email,
      subject,
      text: `${text}\n${unsub ? `\nUnsubscribe: ${unsub}\n` : "\nTurn this off in Settings → Notifications.\n"}`,
      headers: unsub
        ? {
            "List-Unsubscribe": `<${unsub}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined,
    });
    if (!result.sent) continue;
    await prisma.user.update({
      where: { id: user.id },
      data: { lastMarketingAt: new Date() },
    });
    sent += 1;
  }

  for (const row of waitlist) {
    const email = row.email.toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const pageUrl = origin
      ? `${origin}/newsletter/unsubscribe?token=${row.unsubscribeToken}`
      : null;
    const oneClick = origin
      ? `${origin}/api/newsletter/unsubscribe?token=${row.unsubscribeToken}`
      : null;
    const result = await sendResendEmail({
      to: row.email,
      subject,
      text: `Hi ${row.firstName},\n\n${text}\n${pageUrl ? `\nUnsubscribe: ${pageUrl}\n` : ""}`,
      headers: oneClick
        ? {
            "List-Unsubscribe": `<${oneClick}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined,
    });
    if (result.sent) sent += 1;
  }

  return { skipped: false, reason: null, sent };
}
