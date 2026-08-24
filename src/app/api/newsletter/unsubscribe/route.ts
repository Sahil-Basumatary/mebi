import { NextResponse } from "next/server";
import { unsubscribeNewsletter } from "@/lib/newsletter";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const destination = new URL("/newsletter/unsubscribe", request.url);
  if (token) {
    destination.searchParams.set("token", token);
  }
  return NextResponse.redirect(destination);
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? undefined;
  const ok = await unsubscribeNewsletter(token);
  if (!ok) {
    return new NextResponse(null, { status: 400 });
  }
  return new NextResponse(null, { status: 200 });
}
