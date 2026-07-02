"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ProfileState = {
  error: string | null;
  success: boolean;
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

// Accept whatever shape a user pastes (bare handle, @handle, or a full profile
// URL) and reduce it to the canonical handle GitHub itself enforces:
// 1-39 chars, alphanumeric or single hyphens, no leading/trailing hyphen.
function normalizeGithubUsername(rawValue: FormDataEntryValue | null): {
  value: string | null;
  error: string | null;
} {
  if (typeof rawValue !== "string") {
    return { value: null, error: null };
  }

  const handle = rawValue
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\/+$/, "")
    .trim();

  if (!handle) {
    return { value: null, error: null };
  }

  const isValid = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/.test(handle);
  if (!isValid) {
    return {
      value: null,
      error: "That doesn't look like a valid GitHub username.",
    };
  }

  return { value: handle, error: null };
}

export async function updateProfile(
  _previousState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "You need to sign in first.", success: false };
  }

  const fullName = getField(formData.get("fullName"), 120);
  const username = getField(formData.get("username"), 40);
  const bio = getField(formData.get("bio"), 400);
  const imageUrl = getField(formData.get("imageUrl"), 500);
  const skills = parseTags(formData.get("skills"));
  const interests = parseTags(formData.get("interests"));
  const prefersSolo = formData.get("prefersSolo") === "on";
  const showGithub = formData.get("showGithub") === "on";
  const roleValue = formData.get("role");
  const github = normalizeGithubUsername(formData.get("githubUsername"));

  if (!fullName) {
    return { error: "Name is required.", success: false };
  }

  if (roleValue !== "BUILDER" && roleValue !== "SPECIALIST" && roleValue !== "LEARNER") {
    return { error: "Choose your role: Builder, Specialist, or Learner.", success: false };
  }

  if (github.error) {
    return { error: github.error, success: false };
  }

  await prisma.user.update({
    where: { clerkId: userId },
    data: {
      fullName,
      username,
      bio,
      imageUrl,
      githubUsername: github.value,
      showGithub,
      skills,
      interests,
      role: roleValue,
      prefersSolo,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/partners");

  return { error: null, success: true };
}
