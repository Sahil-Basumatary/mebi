export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isPlausibleEmail(email: string): boolean {
  if (email.length < 5 || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isKclEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!isPlausibleEmail(normalized)) return false;
  const domain = normalized.split("@")[1];
  return domain === "kcl.ac.uk" || domain.endsWith(".kcl.ac.uk");
}
