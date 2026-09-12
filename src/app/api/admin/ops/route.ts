import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { grantBetaPro, setAiGlobalDisabled } from "@/lib/entitlements";

function authorized(request: Request): boolean {
  const secret = process.env.PRO_GRANT_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() ?? "";
  if (!token || token.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (typeof body.globalDisabled === "boolean") {
    await setAiGlobalDisabled(body.globalDisabled);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const untilRaw = typeof body.until === "string" ? body.until : "";
  if (email && untilRaw) {
    const until = new Date(untilRaw);
    if (Number.isNaN(until.getTime())) {
      return NextResponse.json({ error: "invalid until" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }
    await grantBetaPro(user.id, until, Boolean(body.foundingOffer));
  }

  return NextResponse.json({ ok: true });
}
