import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export type EmailOptOutKind = "digest" | "marketing";

function signingSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim() || process.env.CLERK_SECRET_KEY?.trim();
  return secret || null;
}

export function emailOptOutToken(userId: string, kind: EmailOptOutKind): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(`${kind}:${userId}`).digest("hex").slice(0, 32);
}

export function emailOptOutValid(
  userId: string,
  kind: EmailOptOutKind,
  token: string | undefined,
): boolean {
  const expected = emailOptOutToken(userId, kind);
  const given = token?.trim() ?? "";
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}
