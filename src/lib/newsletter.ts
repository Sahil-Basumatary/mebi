import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { isKclEmail, normalizeEmail } from "@/lib/kcl-email";
import { sendResendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_PER_HOUR = 5;
const MAX_PER_DAY = 12;
const FIRST_NAME_PATTERN = /^[\p{L}][\p{L}\s'-]{0,79}$/u;

export type NewsletterJoinResult = {
  ok: boolean;
  error: string | null;
};

function clientIp(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return headerList.get("x-real-ip")?.trim().slice(0, 64) || "unknown";
}

function hashIp(ip: string): string {
  const salt = process.env.CLERK_SECRET_KEY || process.env.DATABASE_URL || "hackollab";
  return createHash("sha256").update(`nl:${salt}:${ip}`).digest("hex");
}

function parseFirstName(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().replace(/\s+/g, " ");
  if (!FIRST_NAME_PATTERN.test(value)) return null;
  return value;
}

function isUniqueConflict(error: unknown, field: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; meta?: { target?: unknown } };
  if (candidate.code !== "P2002") return false;
  const target = candidate.meta?.target;
  const asText = Array.isArray(target) ? target.join(",") : String(target ?? "");
  return asText.includes(field);
}

function requestOrigin(headerList: Headers): string | null {
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return null;
  const proto =
    headerList.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");
  return `${proto}://${host}`;
}

async function sendAck(email: string, firstName: string, origin: string | null, token: string) {
  const pageUrl = origin ? `${origin}/newsletter/unsubscribe?token=${token}` : null;
  const oneClickUrl = origin ? `${origin}/api/newsletter/unsubscribe?token=${token}` : null;
  const mailHeaders: Record<string, string> = {};
  if (oneClickUrl) {
    mailHeaders["List-Unsubscribe"] = `<${oneClickUrl}>`;
    mailHeaders["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const unsubscribeLine = pageUrl
    ? `\nIf this wasn't you, ignore this or unsubscribe:\n${pageUrl}\n`
    : "\nIf this wasn't you, ignore this email.\n";

  await sendResendEmail({
    to: email,
    subject: "You're on the Hackollab list",
    text: `Hi ${firstName},\n\nYou're on the Hackollab early list. We'll email this KCL address when there's a note worth sending. This does not create an account.\n${unsubscribeLine}`,
    headers: Object.keys(mailHeaders).length ? mailHeaders : undefined,
  });
}

export async function joinNewsletterWaitlist(formData: FormData): Promise<NewsletterJoinResult> {
  const honeypot = formData.get("fax");
  if (typeof honeypot === "string" && honeypot.trim()) {
    return { ok: true, error: null };
  }

  const consent = formData.get("consent");
  if (consent !== "on" && consent !== "true") {
    return { ok: false, error: "Confirm you want occasional notes at this address." };
  }

  const firstName = parseFirstName(formData.get("firstName"));
  if (!firstName) {
    return { ok: false, error: "Add your first name." };
  }

  const rawEmail = formData.get("email");
  if (typeof rawEmail !== "string") {
    return { ok: false, error: "Use your KCL email." };
  }
  const email = normalizeEmail(rawEmail);
  if (!isKclEmail(email)) {
    return { ok: false, error: "Use your KCL email." };
  }

  const headerList = await headers();
  const ipHash = hashIp(clientIp(headerList));
  const userAgent = headerList.get("user-agent")?.slice(0, 200) ?? null;
  const origin = requestOrigin(headerList);
  const now = Date.now();

  const [hourly, daily] = await Promise.all([
    prisma.newsletterSignup.count({
      where: { ipHash, updatedAt: { gte: new Date(now - HOUR_MS) } },
    }),
    prisma.newsletterSignup.count({
      where: { ipHash, updatedAt: { gte: new Date(now - DAY_MS) } },
    }),
  ]);
  if (hourly >= MAX_PER_HOUR || daily >= MAX_PER_DAY) {
    return { ok: false, error: "Too many attempts. Try again later." };
  }

  const existing = await prisma.newsletterSignup.findUnique({
    where: { email },
    select: {
      id: true,
      unsubscribeToken: true,
      unsubscribedAt: true,
    },
  });

  if (existing && !existing.unsubscribedAt) {
    return { ok: true, error: null };
  }

  let token = existing?.unsubscribeToken ?? randomBytes(32).toString("hex");

  try {
    if (existing?.unsubscribedAt) {
      await prisma.newsletterSignup.update({
        where: { id: existing.id },
        data: {
          firstName,
          ipHash,
          userAgent,
          unsubscribedAt: null,
        },
      });
    } else {
      await prisma.newsletterSignup.create({
        data: {
          email,
          firstName,
          ipHash,
          userAgent,
          unsubscribeToken: token,
        },
      });
    }
  } catch (error) {
    if (isUniqueConflict(error, "email")) {
      return { ok: true, error: null };
    }
    if (isUniqueConflict(error, "unsubscribeToken")) {
      token = randomBytes(32).toString("hex");
      try {
        await prisma.newsletterSignup.create({
          data: {
            email,
            firstName,
            ipHash,
            userAgent,
            unsubscribeToken: token,
          },
        });
      } catch (retryError) {
        if (isUniqueConflict(retryError, "email")) {
          return { ok: true, error: null };
        }
        console.error("newsletter_join_failed");
        return { ok: false, error: "Could not join right now. Try again." };
      }
    } else {
      console.error("newsletter_join_failed");
      return { ok: false, error: "Could not join right now. Try again." };
    }
  }

  await sendAck(email, firstName, origin, token);
  return { ok: true, error: null };
}

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

function parseToken(token: string | undefined): string | null {
  const value = token?.trim() ?? "";
  return TOKEN_PATTERN.test(value) ? value : null;
}

export async function getNewsletterStatus(
  token: string | undefined,
): Promise<"invalid" | "active" | "unsubscribed"> {
  const value = parseToken(token);
  if (!value) return "invalid";
  const row = await prisma.newsletterSignup.findUnique({
    where: { unsubscribeToken: value },
    select: { unsubscribedAt: true },
  });
  if (!row) return "invalid";
  return row.unsubscribedAt ? "unsubscribed" : "active";
}

export async function unsubscribeNewsletter(token: string | undefined): Promise<boolean> {
  const value = parseToken(token);
  if (!value) return false;

  const result = await prisma.newsletterSignup.updateMany({
    where: { unsubscribeToken: value, unsubscribedAt: null },
    data: { unsubscribedAt: new Date() },
  });
  if (result.count > 0) return true;

  const existing = await prisma.newsletterSignup.findUnique({
    where: { unsubscribeToken: value },
    select: { id: true },
  });
  return Boolean(existing);
}
