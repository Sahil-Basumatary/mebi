"use server";

import { auth } from "@clerk/nextjs/server";
import type { ThemePreference } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ProfileState = {
  error: string | null;
  success: boolean;
};

export type SettingsData = {
  email: string;
  themePreference: ThemePreference;
  profile: {
    fullName: string;
    username: string;
    bio: string;
    imageUrl: string;
    githubUsername: string;
    showGithub: boolean;
    skills: string;
    interests: string;
    role: "BUILDER" | "SPECIALIST" | "LEARNER" | "";
    prefersSolo: boolean;
  };
};

function parseTags(rawValue: FormDataEntryValue | null): string[] {
  if (typeof rawValue !== "string") {
    return [];
  }

  return [
    ...new Set(
      rawValue
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ].slice(0, 20);
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

export async function getSettingsData(): Promise<SettingsData | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return null;
  }

  return {
    email: user.email,
    themePreference: user.themePreference,
    profile: {
      fullName: user.fullName ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
      imageUrl: user.imageUrl ?? "",
      githubUsername: user.githubUsername ?? "",
      showGithub: user.showGithub,
      skills: user.skills.join(", "),
      interests: user.interests.join(", "),
      role: (user.role ?? "") as "BUILDER" | "SPECIALIST" | "LEARNER" | "",
      prefersSolo: user.prefersSolo,
    },
  };
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

  revalidatePath("/dashboard");
  revalidatePath("/partners");

  return { error: null, success: true };
}

export async function setAvatar(imageUrl: string): Promise<{ error: string | null }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "You need to sign in first." };
  }

  // Only accept URLs from our own Blob store so a crafted request can't point a
  // profile picture at an arbitrary external host.
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return { error: "Invalid image URL." };
  }

  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".blob.vercel-storage.com")) {
    return { error: "Unsupported image source." };
  }

  await prisma.user.update({
    where: { clerkId: userId },
    data: { imageUrl: parsed.toString() },
  });

  revalidatePath("/dashboard");
  revalidatePath("/partners");

  return { error: null };
}

const THEME_VALUES: ThemePreference[] = ["LIGHT", "DARK", "SYSTEM"];

export async function updateThemePreference(preference: ThemePreference): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    return;
  }

  if (!THEME_VALUES.includes(preference)) {
    return;
  }

  await prisma.user.update({
    where: { clerkId: userId },
    data: { themePreference: preference },
  });
}
