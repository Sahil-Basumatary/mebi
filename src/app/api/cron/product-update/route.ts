import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { sendProductUpdate } from "@/lib/digest-mail";

export async function POST(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const record = body as { subject?: unknown; text?: unknown };
  const subject = typeof record.subject === "string" ? record.subject.trim().slice(0, 120) : "";
  const text = typeof record.text === "string" ? record.text.trim().slice(0, 4000) : "";
  if (subject.length < 4 || text.length < 20) {
    return NextResponse.json({ error: "subject_or_text_too_short" }, { status: 400 });
  }

  const result = await sendProductUpdate(subject, text);
  return NextResponse.json(result);
}
