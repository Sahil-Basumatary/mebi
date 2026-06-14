"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type OnboardingState = {
  error: string | null;
};

function parseTags(rawValue: FormDataEntryValue | null): string[] {
  if (typeof rawValue !== "string") {
    return [];
  }

  return [...new Set(rawValue.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}

function getField(rawValue: FormDataEntryValue | null, maxLength: number): string | null {
  if (typeof rawValue !== "string") {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

export async function completeOnboarding(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "You need to sign in first." };
  }

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase() ??
    clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

  if (!email) {
    return { error: "We could not read your email from Clerk. Please sign in again." };
  }

  const fullName = getField(formData.get("fullName"), 120);
  const username = getField(formData.get("username"), 40);
  const bio = getField(formData.get("bio"), 400);
  const imageUrl = getField(formData.get("imageUrl"), 500);
  const skills = parseTags(formData.get("skills"));
  const interests = parseTags(formData.get("interests"));
  const prefersSolo = formData.get("prefersSolo") === "on";
  const roleValue = formData.get("role");

  if (!fullName) {
    return { error: "Name is required." };
  }

  if (roleValue !== "BUILDER" && roleValue !== "SPECIALIST" && roleValue !== "LEARNER") {
    return { error: "Choose your role: Builder, Specialist, or Learner." };
  }

  await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      email,
      fullName,
      username,
      bio,
      imageUrl,
      skills,
      interests,
      role: roleValue,
      prefersSolo,
      onboarded: true,
    },
    create: {
      clerkId: userId,
      email,
      fullName,
      username,
      bio,
      imageUrl,
      skills,
      interests,
      role: roleValue,
      prefersSolo,
      onboarded: true,
    },
  });

  redirect("/dashboard");
}
