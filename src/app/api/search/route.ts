import { NextResponse } from "next/server";
import { getOnboardedUserOrNull } from "@/lib/current-user";
import { searchAppContent } from "@/lib/search";

export async function GET(request: Request) {
  const viewer = await getOnboardedUserOrNull();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchAppContent(viewer.id, q);
  return NextResponse.json(results);
}
