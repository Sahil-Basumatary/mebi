export type StartupPreferenceValue = "HOME" | "LAST_VISITED";

export const HOME_PATH = "/dashboard";

const ALLOWED_PREFIXES = [
  "/dashboard",
  "/projects",
  "/partners",
  "/inbox",
  "/community",
  "/events",
] as const;

export function isAllowedAppPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.includes("?") || path.includes("#") || path.includes("//")) return false;
  return ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function resolveStartupPath(
  preference: StartupPreferenceValue,
  lastVisitedPath: string | null | undefined,
): string {
  if (preference === "LAST_VISITED" && lastVisitedPath && isAllowedAppPath(lastVisitedPath)) {
    return lastVisitedPath;
  }
  return HOME_PATH;
}

export function startupLabel(preference: StartupPreferenceValue): string {
  return preference === "LAST_VISITED" ? "Last visited page" : "Home";
}
