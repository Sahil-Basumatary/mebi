import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveStartupPath } from "@/lib/startup";

// Auth entry resolver: Home vs last visited page from the signed-in profile.
export default async function StartPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      onboarded: true,
      startupPreference: true,
      lastVisitedPath: true,
    },
  });

  if (!user || !user.onboarded) {
    redirect("/onboarding");
  }

  redirect(resolveStartupPath(user.startupPreference, user.lastVisitedPath));
}
