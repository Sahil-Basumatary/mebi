const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "app",
  "b",
  "community",
  "dashboard",
  "events",
  "forum",
  "help",
  "home",
  "inbox",
  "login",
  "me",
  "mebi",
  "null",
  "onboarding",
  "partners",
  "projects",
  "proof",
  "root",
  "settings",
  "sign-in",
  "sign-up",
  "signin",
  "signup",
  "start",
  "support",
  "u",
  "undefined",
  "www",
]);

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/;

export function normalizeUsername(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed || null;
}

export function validateUsername(raw: string | null | undefined): {
  value: string | null;
  error: string | null;
} {
  const value = normalizeUsername(raw);
  if (!value) {
    return { value: null, error: "Username is required for a public profile." };
  }

  if (value.length < 3 || value.length > 30) {
    return { value: null, error: "Username must be 3–30 characters." };
  }

  if (!USERNAME_PATTERN.test(value)) {
    return {
      value: null,
      error: "Use lowercase letters, numbers, hyphens, or underscores.",
    };
  }

  if (RESERVED_USERNAMES.has(value)) {
    return { value: null, error: "That username is reserved." };
  }

  return { value, error: null };
}

export function isReservedUsername(raw: string): boolean {
  return RESERVED_USERNAMES.has(normalizeUsername(raw) ?? "");
}
