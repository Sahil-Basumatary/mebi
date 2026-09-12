import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createGithubInstallUrl } from "@/lib/github/install";
import { resolveAppOrigin } from "@/lib/app-origin";

export async function GET(request: Request) {
  const origin = resolveAppOrigin(request);
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", origin));
  }
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, onboarded: true },
  });
  if (!user?.onboarded) {
    return NextResponse.redirect(new URL("/onboarding", origin));
  }
  try {
    const url = await createGithubInstallUrl(user.id);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL("/home?settings=connections&github=error", origin));
  }
}
