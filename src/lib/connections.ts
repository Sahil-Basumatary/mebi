import { normalizeSocialUrl } from "@/lib/social-links";

export type ConnectionKind = "github" | "linkedin" | "discord" | "calendar";

export type ConnectionResult = {
  value: string | null;
  error: string | null;
};

const DISCORD_HANDLE =
  /^(?!.*\.\.)[a-z0-9._]{2,32}$/i;
const LINKEDIN_PATH = /^\/in\/[a-zA-Z0-9\-_%]+\/?$/;
const CALENDAR_HOSTS = new Set([
  "cal.com",
  "calendly.com",
  "calendar.app.google",
  "calendar.google.com",
]);

export function normalizeGithubConnection(
  raw: FormDataEntryValue | string | null,
): ConnectionResult {
  if (typeof raw !== "string") return { value: null, error: null };
  const handle = raw
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\/+$/, "")
    .trim();
  if (!handle) return { value: null, error: null };
  if (!/^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/.test(handle)) {
    return { value: null, error: "That doesn't look like a valid GitHub username." };
  }
  return { value: handle, error: null };
}

export function githubProfileUrl(username: string): string {
  return `https://github.com/${username}`;
}

export function normalizeLinkedinConnection(
  raw: FormDataEntryValue | string | null,
): ConnectionResult {
  if (typeof raw !== "string") return { value: null, error: null };
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, error: null };

  const asUrl = normalizeSocialUrl(
    trimmed.includes("linkedin.com") ? trimmed : `linkedin.com/in/${trimmed.replace(/^\/?in\//, "")}`,
  );
  if (!asUrl) return { value: null, error: "Enter a LinkedIn profile URL or /in/ handle." };

  let parsed: URL;
  try {
    parsed = new URL(asUrl);
  } catch {
    return { value: null, error: "Enter a LinkedIn profile URL or /in/ handle." };
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "linkedin.com") {
    return { value: null, error: "Use a linkedin.com profile link." };
  }
  if (!LINKEDIN_PATH.test(parsed.pathname)) {
    return { value: null, error: "Use a personal LinkedIn URL like linkedin.com/in/your-name." };
  }

  parsed.hash = "";
  parsed.search = "";
  if (!parsed.pathname.endsWith("/")) parsed.pathname += "/";
  return { value: parsed.toString(), error: null };
}

export function normalizeDiscordConnection(
  raw: FormDataEntryValue | string | null,
): ConnectionResult {
  if (typeof raw !== "string") return { value: null, error: null };
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, error: null };

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes("discord.")) {
    const asUrl = normalizeSocialUrl(trimmed);
    if (!asUrl) return { value: null, error: "Enter a Discord username or invite/profile URL." };
    let parsed: URL;
    try {
      parsed = new URL(asUrl);
    } catch {
      return { value: null, error: "Enter a Discord username or invite/profile URL." };
    }
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "discord.com" && host !== "discord.gg" && host !== "discordapp.com") {
      return { value: null, error: "Use a Discord username, discord.gg invite, or discord.com link." };
    }
    return { value: asUrl, error: null };
  }

  const handle = trimmed.replace(/^@/, "");
  if (!DISCORD_HANDLE.test(handle)) {
    return {
      value: null,
      error: "Discord usernames are 2–32 characters: letters, numbers, underscore, or period.",
    };
  }
  return { value: handle, error: null };
}

export function discordDisplay(value: string): string {
  if (value.startsWith("http")) {
    try {
      const parsed = new URL(value);
      return parsed.hostname.replace(/^www\./, "") + parsed.pathname.replace(/\/$/, "");
    } catch {
      return value;
    }
  }
  return `@${value}`;
}

export function discordHref(value: string): string | null {
  if (value.startsWith("http")) return value;
  return null;
}

export function normalizeCalendarConnection(
  raw: FormDataEntryValue | string | null,
): ConnectionResult {
  if (typeof raw !== "string") return { value: null, error: null };
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, error: null };

  const asUrl = normalizeSocialUrl(trimmed);
  if (!asUrl) return { value: null, error: "Enter a calendar booking URL." };

  let parsed: URL;
  try {
    parsed = new URL(asUrl);
  } catch {
    return { value: null, error: "Enter a calendar booking URL." };
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const allowed =
    CALENDAR_HOSTS.has(host) ||
    host.endsWith(".cal.com") ||
    host.endsWith(".calendly.com");
  if (!allowed) {
    return {
      value: null,
      error: "Use a Cal.com, Calendly, or Google Calendar link.",
    };
  }
  return { value: asUrl, error: null };
}

export function calendarDisplay(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") + parsed.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}
