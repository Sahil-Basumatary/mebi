export type SocialPlatform =
  | "github"
  | "linkedin"
  | "x"
  | "instagram"
  | "youtube"
  | "facebook"
  | "mastodon"
  | "website";

export const MAX_SOCIAL_LINKS = 4;

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  mastodon: "Mastodon",
  website: "Website",
};

export function platformLabel(platform: SocialPlatform): string {
  return PLATFORM_LABELS[platform];
}

export function detectPlatform(url: string): SocialPlatform {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "website";
  }

  if (host === "github.com") return "github";
  if (host === "linkedin.com") return "linkedin";
  if (host === "x.com" || host === "twitter.com") return "x";
  if (host === "instagram.com") return "instagram";
  if (host === "youtube.com" || host === "youtu.be") return "youtube";
  if (host === "facebook.com" || host === "fb.com") return "facebook";
  if (host === "mastodon.social" || host.startsWith("mastodon.")) return "mastodon";
  return "website";
}

// Accept whatever a user pastes (with or without a scheme) and reduce it to a
// safe absolute https(s) URL, or null if it can't be trusted as a real link.
export function normalizeSocialUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  // Reject bare hosts without a dot (e.g. "localhost", "foo") so we only store
  // things that look like real public profiles.
  if (!parsed.hostname.includes(".")) return null;

  return parsed.toString();
}
