import { NextResponse } from "next/server";
import { emailOptOutValid, type EmailOptOutKind } from "@/lib/email-optout";
import { prisma } from "@/lib/prisma";

function parseKind(raw: string | null): EmailOptOutKind | null {
  return raw === "digest" || raw === "marketing" ? raw : null;
}

async function applyOptOut(userId: string, kind: EmailOptOutKind, token: string | undefined) {
  if (!emailOptOutValid(userId, kind, token)) return false;
  if (kind === "digest") {
    await prisma.user.updateMany({
      where: { id: userId },
      data: { notifyWeeklyDigest: false },
    });
    return true;
  }
  await prisma.user.updateMany({
    where: { id: userId },
    data: { notifyMarketing: false },
  });
  return true;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("u") ?? "";
  const kind = parseKind(url.searchParams.get("k"));
  const token = url.searchParams.get("t") ?? undefined;
  if (!kind || !userId) {
    return NextResponse.redirect(new URL("/email/unsubscribed?ok=0", request.url));
  }
  const ok = await applyOptOut(userId, kind, token);
  const dest = new URL("/email/unsubscribed", request.url);
  dest.searchParams.set("ok", ok ? "1" : "0");
  dest.searchParams.set("k", kind);
  return NextResponse.redirect(dest);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("u") ?? "";
  const kind = parseKind(url.searchParams.get("k"));
  const token = url.searchParams.get("t") ?? undefined;
  if (!kind || !userId) {
    return new NextResponse(null, { status: 400 });
  }
  const ok = await applyOptOut(userId, kind, token);
  if (!ok) return new NextResponse(null, { status: 400 });
  return new NextResponse(null, { status: 200 });
}
