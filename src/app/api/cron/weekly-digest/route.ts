import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { sendWeeklyDigests } from "@/lib/digest-mail";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await sendWeeklyDigests();
  return NextResponse.json(result);
}
