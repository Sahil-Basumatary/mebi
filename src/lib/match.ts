import type { UserRole } from "@prisma/client";

export type Matchable = {
  skills: string[];
  interests: string[];
  role: UserRole | null;
};

export type MatchBreakdown = {
  score: number;
  sharedSkills: string[];
  sharedInterests: string[];
  complementaryRole: boolean;
};

function normalize(tag: string): string {
  return tag.trim().toLowerCase();
}

export function intersectTags(left: string[], right: string[]): string[] {
  const lookup = new Set(right.map(normalize));
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of left) {
    const key = normalize(tag);
    if (lookup.has(key) && !seen.has(key)) {
      seen.add(key);
      result.push(tag);
    }
  }

  return result;
}

const SKILL_WEIGHT = 3;
const INTEREST_WEIGHT = 2;
const COMPLEMENT_BONUS = 2;

export function scoreMatch(viewer: Matchable, candidate: Matchable): MatchBreakdown {
  const sharedSkills = intersectTags(viewer.skills, candidate.skills);
  const sharedInterests = intersectTags(viewer.interests, candidate.interests);

  // Different roles tend to fill each other's gaps (the "missing role" idea this
  // whole product is built around), so a small bonus nudges genuinely
  // complementary pairings above same-role overlaps.
  const complementaryRole = Boolean(
    viewer.role && candidate.role && viewer.role !== candidate.role,
  );

  const score =
    sharedSkills.length * SKILL_WEIGHT +
    sharedInterests.length * INTEREST_WEIGHT +
    (complementaryRole ? COMPLEMENT_BONUS : 0);

  return { score, sharedSkills, sharedInterests, complementaryRole };
}
