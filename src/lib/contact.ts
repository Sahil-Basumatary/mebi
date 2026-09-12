import "server-only";

import { headers } from "next/headers";
import { sendResendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { clientIp, hashClientIp } from "@/lib/request-ip";
import {
  CONTACT_RETENTION_DAYS,
  SUPPORT_INBOX,
  parseContactFields,
} from "@/lib/contact-validation";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_PER_HOUR = 4;
const MAX_PER_DAY = 8;

export type ContactSubmitResult = {
  ok: boolean;
  error: string | null;
};

export async function submitContactForm(formData: FormData): Promise<ContactSubmitResult> {
  const parsed = parseContactFields({
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    honeypot: formData.get("fax"),
  });
  if (!parsed.ok) {
    if (parsed.error === "ignored") {
      return { ok: true, error: null };
    }
    return { ok: false, error: parsed.error };
  }

  const headerList = await headers();
  const ipHash = hashClientIp(clientIp(headerList), "contact");
  const userAgent = headerList.get("user-agent")?.slice(0, 200) ?? null;
  const now = Date.now();

  const [hourly, daily] = await Promise.all([
    prisma.contactSubmission.count({
      where: { ipHash, createdAt: { gte: new Date(now - HOUR_MS) } },
    }),
    prisma.contactSubmission.count({
      where: { ipHash, createdAt: { gte: new Date(now - DAY_MS) } },
    }),
  ]);
  if (hourly >= MAX_PER_HOUR || daily >= MAX_PER_DAY) {
    return { ok: false, error: "Too many messages. Try again later." };
  }

  const expiresAt = new Date(now + CONTACT_RETENTION_DAYS * DAY_MS);
  const row = await prisma.contactSubmission.create({
    data: {
      email: parsed.value.email,
      subject: parsed.value.subject,
      message: parsed.value.message,
      ipHash,
      userAgent,
      expiresAt,
    },
    select: { id: true },
  });

  const inbox = process.env.SUPPORT_INBOX?.trim() || SUPPORT_INBOX;
  const mailed = await sendResendEmail({
    to: inbox,
    replyTo: parsed.value.email,
    subject: `[Hackollab support] ${parsed.value.subject}`,
    text: `From: ${parsed.value.email}\nSubject: ${parsed.value.subject}\nRef: ${row.id}\n\n${parsed.value.message}\n`,
  });

  if (mailed.sent) {
    await prisma.contactSubmission.update({
      where: { id: row.id },
      data: { mailedAt: new Date() },
    });
  }

  return { ok: true, error: null };
}

export async function purgeExpiredContactSubmissions(): Promise<{ deleted: number }> {
  const result = await prisma.contactSubmission.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return { deleted: result.count };
}
