"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import type { StartupPreference, ThemePreference } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  DEFAULT_SHORTCUT_BINDINGS,
  mergeShortcutBindings,
  normalizeCombo,
  type ShortcutBindingMap,
  type ShortcutId,
} from "@/lib/keyboard-shortcuts";
import { SPELLCHECKER_CODES } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { MAX_SOCIAL_LINKS, normalizeSocialUrl } from "@/lib/social-links";
import { isAllowedAppPath, type StartupPreferenceValue } from "@/lib/startup";
import {
  normalizeCookieConsent,
  type CookieConsentState,
} from "@/lib/cookie-consent";

export type ProfileState = {
  error: string | null;
  success: boolean;
};

export type SettingsData = {
  email: string;
  themePreference: ThemePreference;
  spellcheckerLanguage: string;
  timezone: string;
  startupPreference: StartupPreferenceValue;
  shortcutBindings: ShortcutBindingMap;
  cookieConsent: CookieConsentState;
  profile: {
    fullName: string;
    username: string;
    bio: string;
    pronouns: string;
    imageUrl: string;
    githubUsername: string;
    showGithub: boolean;
    socialLinks: string[];
    skills: string;
    interests: string;
    role: "BUILDER" | "SPECIALIST" | "LEARNER" | "";
    prefersSolo: boolean;
    profilePrivate: boolean;
  };
};

const PRONOUN_PRESETS = ["they/them", "she/her", "he/him"];

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

// The form sends the dropdown choice plus a free-text field that only matters
// when "custom" is picked. Resolve both into the single value we persist.
function resolvePronouns(formData: FormData): string | null {
  const choice = getField(formData.get("pronounsSelect"), 40);
  if (choice === "custom") {
    return getField(formData.get("pronounsCustom"), 40);
  }
  if (choice && PRONOUN_PRESETS.includes(choice)) {
    return choice;
  }
  return null;
}

function collectSocialLinks(formData: FormData): string[] {
  const links: string[] = [];
  for (let index = 0; index < MAX_SOCIAL_LINKS; index += 1) {
    const raw = formData.get(`socialLink${index}`);
    if (typeof raw !== "string") continue;
    const normalized = normalizeSocialUrl(raw);
    if (normalized && !links.includes(normalized)) {
      links.push(normalized);
    }
  }
  return links.slice(0, MAX_SOCIAL_LINKS);
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

  const shortcutBindings = await loadShortcutBindingsForUser(userId);

  return {
    email: user.email,
    themePreference: user.themePreference,
    spellcheckerLanguage: user.spellcheckerLanguage,
    timezone: user.timezone,
    startupPreference: user.startupPreference,
    shortcutBindings,
    cookieConsent: normalizeCookieConsent({
      preferences: user.cookiePreferences,
      analytics: user.cookieAnalytics,
      marketing: user.cookieMarketing,
      decidedAt: user.cookieConsentAt?.toISOString() ?? null,
    }),
    profile: {
      fullName: user.fullName ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
      pronouns: user.pronouns ?? "",
      imageUrl: user.imageUrl ?? "",
      githubUsername: user.githubUsername ?? "",
      showGithub: user.showGithub,
      socialLinks: user.socialLinks,
      skills: user.skills.join(", "),
      interests: user.interests.join(", "),
      role: (user.role ?? "") as "BUILDER" | "SPECIALIST" | "LEARNER" | "",
      prefersSolo: user.prefersSolo,
      profilePrivate: user.profilePrivate,
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
  const pronouns = resolvePronouns(formData);
  const imageUrl = getField(formData.get("imageUrl"), 500);
  const socialLinks = collectSocialLinks(formData);
  const skills = parseTags(formData.get("skills"));
  const interests = parseTags(formData.get("interests"));
  const prefersSolo = formData.get("prefersSolo") === "on";
  // Discoverability is independent of solo focus — private can apply either way.
  const profilePrivate = formData.get("profilePrivate") === "on";
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
      pronouns,
      imageUrl,
      githubUsername: github.value,
      showGithub,
      socialLinks,
      skills,
      interests,
      role: roleValue,
      prefersSolo,
      profilePrivate,
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

export async function deleteAccount(): Promise<{ error: string | null }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "You need to sign in first." };
  }

  // Clear our data first — every relation cascades off User, so this removes the
  // profile, projects, requests, partnerships, and notifications in one delete.
  // Ignore a missing row so a half-provisioned account can still be torn down.
  try {
    await prisma.user.delete({ where: { clerkId: userId } });
  } catch {
    // No DB row to remove; fall through to deleting the identity itself.
  }

  // Deleting the Clerk identity is the source-of-truth step: once it's gone the
  // session is invalid and the account can never sign in again.
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch {
    return { error: "We couldn't delete your account. Please try again." };
  }

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

export async function updateSpellcheckerLanguage(code: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;
  if (!SPELLCHECKER_CODES.has(code)) return;

  await prisma.user.update({
    where: { clerkId: userId },
    data: { spellcheckerLanguage: code },
  });
}

export async function updateTimezone(timezone: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  const trimmed = timezone.trim();
  if (trimmed !== "auto") {
    try {
      // Throws RangeError for unknown IANA ids.
      Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    } catch {
      return;
    }
  }

  await prisma.user.update({
    where: { clerkId: userId },
    data: { timezone: trimmed },
  });
}

const STARTUP_VALUES: StartupPreference[] = ["HOME", "LAST_VISITED"];

async function getUserIdByClerk(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function loadShortcutBindingsForUser(
  clerkId: string,
): Promise<ShortcutBindingMap> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      shortcutBindings: {
        select: { actionId: true, combo: true },
      },
    },
  });
  const raw = Object.fromEntries(
    (user?.shortcutBindings ?? []).map((row) => [row.actionId, row.combo]),
  );
  return mergeShortcutBindings(raw);
}

export async function getShortcutBindings(): Promise<ShortcutBindingMap> {
  const { userId } = await auth();
  if (!userId) return DEFAULT_SHORTCUT_BINDINGS;
  return loadShortcutBindingsForUser(userId);
}

export async function updateStartupPreference(
  preference: StartupPreferenceValue,
): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;
  if (!STARTUP_VALUES.includes(preference)) return;

  await prisma.user.update({
    where: { clerkId: userId },
    data: { startupPreference: preference },
  });
}

export async function updateLastVisitedPath(path: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;
  if (!isAllowedAppPath(path)) return;

  await prisma.user.update({
    where: { clerkId: userId },
    data: { lastVisitedPath: path },
  });
}

export async function updateShortcutBindings(
  bindings: Partial<Record<ShortcutId, string>>,
): Promise<{ error: string | null; bindings: ShortcutBindingMap }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "You need to sign in first.", bindings: DEFAULT_SHORTCUT_BINDINGS };
  }

  const dbUserId = await getUserIdByClerk(userId);
  if (!dbUserId) {
    return { error: "Account not found.", bindings: DEFAULT_SHORTCUT_BINDINGS };
  }

  const next = await loadShortcutBindingsForUser(userId);
  for (const [id, combo] of Object.entries(bindings)) {
    if (typeof combo !== "string") continue;
    const actionId = id as ShortcutId;
    const normalized = normalizeCombo(combo);
    if (!normalized) {
      return { error: `Invalid shortcut for ${id}.`, bindings: next };
    }
    next[actionId] = normalized;
    if (normalized === DEFAULT_SHORTCUT_BINDINGS[actionId]) {
      await prisma.userShortcutBinding.deleteMany({
        where: { userId: dbUserId, actionId },
      });
    } else {
      await prisma.userShortcutBinding.upsert({
        where: {
          userId_actionId: { userId: dbUserId, actionId },
        },
        create: { userId: dbUserId, actionId, combo: normalized },
        update: { combo: normalized },
      });
    }
  }

  return { error: null, bindings: next };
}

export async function resetShortcutBindings(): Promise<ShortcutBindingMap> {
  const { userId } = await auth();
  if (!userId) return DEFAULT_SHORTCUT_BINDINGS;

  const dbUserId = await getUserIdByClerk(userId);
  if (!dbUserId) return DEFAULT_SHORTCUT_BINDINGS;

  await prisma.userShortcutBinding.deleteMany({ where: { userId: dbUserId } });
  return DEFAULT_SHORTCUT_BINDINGS;
}

export async function updateProfileDiscoverability(
  discoverable: boolean,
): Promise<{ error: string | null; profilePrivate: boolean }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "You need to sign in first.", profilePrivate: false };
  }

  const profilePrivate = !discoverable;
  await prisma.user.update({
    where: { clerkId: userId },
    data: { profilePrivate },
  });

  revalidatePath("/partners");
  revalidatePath("/dashboard");
  return { error: null, profilePrivate };
}

export async function getCookieConsent(): Promise<CookieConsentState> {
  const { userId } = await auth();
  if (!userId) return normalizeCookieConsent(null);

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      cookieConsentAt: true,
      cookiePreferences: true,
      cookieAnalytics: true,
      cookieMarketing: true,
    },
  });
  if (!user) return normalizeCookieConsent(null);

  return normalizeCookieConsent({
    preferences: user.cookiePreferences,
    analytics: user.cookieAnalytics,
    marketing: user.cookieMarketing,
    decidedAt: user.cookieConsentAt?.toISOString() ?? null,
  });
}

export async function updateCookieConsent(input: {
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}): Promise<CookieConsentState> {
  const decidedAt = new Date();
  const next = normalizeCookieConsent({
    preferences: input.preferences,
    analytics: input.analytics,
    marketing: input.marketing,
    decidedAt: decidedAt.toISOString(),
  });

  const { userId } = await auth();
  if (!userId) return next;

  await prisma.user.update({
    where: { clerkId: userId },
    data: {
      cookieConsentAt: decidedAt,
      cookiePreferences: next.preferences,
      cookieAnalytics: next.analytics,
      cookieMarketing: next.marketing,
    },
  });

  return next;
}
