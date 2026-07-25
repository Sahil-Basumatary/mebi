import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function requireOnboardedUser() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user || !user.onboarded) {
    redirect("/onboarding");
  }

  return user;
}

// Resolves the signed-in user's saved theme so the root layout can seed
// next-themes on the server and avoid a flash on first paint. Logged-out
// visitors (marketing/auth) fall back to the app's default light palette.
export async function getInitialTheme(): Promise<"light" | "dark" | "system"> {
  const { userId } = await auth();
  if (!userId) {
    return "light";
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { themePreference: true },
  });

  if (!user) {
    return "light";
  }

  return user.themePreference.toLowerCase() as "light" | "dark" | "system";
}

export async function getInitialLocalePrefs(): Promise<{
  spellcheckerLanguage: string;
  timezone: string;
}> {
  const { userId } = await auth();
  if (!userId) {
    return { spellcheckerLanguage: "en-GB", timezone: "auto" };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { spellcheckerLanguage: true, timezone: true },
  });

  if (!user) {
    return { spellcheckerLanguage: "en-GB", timezone: "auto" };
  }

  return {
    spellcheckerLanguage: user.spellcheckerLanguage,
    timezone: user.timezone,
  };
}
