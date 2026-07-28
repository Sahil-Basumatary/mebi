import type { UserRole } from "@prisma/client";

export const ROLE_LABEL: Record<UserRole, string> = {
  BUILDER: "Builder",
  SPECIALIST: "Specialist",
  LEARNER: "Learner",
};

export function displayName(fullName: string | null, username: string | null): string {
  return fullName || username || "KCL builder";
}

export function initials(fullName: string | null, username: string | null): string {
  return displayName(fullName, username)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
