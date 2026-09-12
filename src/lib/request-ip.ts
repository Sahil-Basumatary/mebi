import { createHash } from "node:crypto";

export function clientIp(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return headerList.get("x-real-ip")?.trim().slice(0, 64) || "unknown";
}

export function hashClientIp(ip: string, scope: string): string {
  const salt = process.env.CLERK_SECRET_KEY || process.env.DATABASE_URL || "hackollab";
  return createHash("sha256").update(`${scope}:${salt}:${ip}`).digest("hex");
}
