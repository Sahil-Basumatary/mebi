export type StartupPreferenceValue = "HOME" | "LAST_VISITED";

export const HOME_PATH = "/home";

const ALLOWED_PREFIXES = [
  "/home",
  "/dashboard",
  "/projects",
  "/partners",
  "/inbox",
  "/proof",
  "/community",
  "/forum",
  "/events",
  "/discover",
  "/leaderboard",
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
    if (lastVisitedPath === "/dashboard" || lastVisitedPath.startsWith("/dashboard/")) {
      return HOME_PATH;
    }
    if (
      lastVisitedPath === "/community" ||
      lastVisitedPath.startsWith("/community/") ||
      lastVisitedPath === "/events" ||
      lastVisitedPath.startsWith("/events/")
    ) {
      return "/forum";
    }
    return lastVisitedPath;
  }
  return HOME_PATH;
}

export function startupLabel(preference: StartupPreferenceValue): string {
  return preference === "LAST_VISITED" ? "Last visited page" : "Home";
}
