import { NextResponse } from "next/server";
import { purgeExpiredContactSubmissions } from "@/lib/contact";
import { cronAuthorized } from "@/lib/cron-auth";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await purgeExpiredContactSubmissions();
  return NextResponse.json(result);
}
