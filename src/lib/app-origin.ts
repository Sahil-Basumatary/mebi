import "server-only";

export function appOrigin(): string | null {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return null;
}

export function resolveAppOrigin(request?: Request): string {
  return appOrigin() || (request ? new URL(request.url).origin : "http://localhost:3000");
}
