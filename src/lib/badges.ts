import { MIN_REAL_UPDATE_CHARS, SYSTEM_UPDATE_BODIES } from "@/lib/proof";
import { buildActivityYear, summarizeActivity, type BuildEvent } from "@/lib/build-activity";

export type BadgeId =
  | "first-ship"
  | "ships-3"
  | "ships-5"
  | "ships-10"
  | "ships-25"
  | "ships-50"
  | "verified-builder"
  | "verified-5"
  | "verified-10"
  | "team-debut"
  | "team-player"
  | "team-veteran"
  | "solo-shipper"
  | "first-attestation"
  | "attested-5"
  | "heavily-attested"
  | "attested-25"
  | "attested-50"
  | "first-witness"
  | "reliable-witness"
  | "seasoned-witness"
  | "streak-3"
  | "streak-7"
  | "streak-14"
  | "streak-30"
  | "streak-60"
  | "streak-100"
  | "log-10"
  | "log-50"
  | "log-100"
  | "log-500"
  | "open-brief"
  | "stack-3"
  | "polymath"
  | "stack-15"
  | "collab-captain"
  | "fleet-captain"
  | "legend-captain";

export type BadgeDefinition = {
  id: BadgeId;
  label: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  category: "ships" | "verification" | "team" | "attestations" | "witness" | "streak" | "log" | "stack" | "leadership";
};

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: "first-ship",
    label: "First Ship",
    description: "Published your first public proof page.",
    tier: "bronze",
    category: "ships",
  },
  {
    id: "ships-3",
    label: "Serial Shipper",
    description: "Published 3 public builds.",
    tier: "bronze",
    category: "ships",
  },
  {
    id: "ships-5",
    label: "Steady Shipper",
    description: "Published 5 public builds.",
    tier: "silver",
    category: "ships",
  },
  {
    id: "ships-10",
    label: "Fleet Builder",
    description: "Published 10 public builds.",
    tier: "gold",
    category: "ships",
  },
  {
    id: "ships-25",
    label: "Workshop Regular",
    description: "Published 25 public builds.",
    tier: "gold",
    category: "ships",
  },
  {
    id: "ships-50",
    label: "Institutional Shipper",
    description: "Published 50 public builds.",
    tier: "platinum",
    category: "ships",
  },
  {
    id: "verified-builder",
    label: "Verified Builder",
    description: "Appeared on a peer-verified published build.",
    tier: "silver",
    category: "verification",
  },
  {
    id: "verified-5",
    label: "Trusted Builder",
    description: "Appeared on 5 peer-verified published builds.",
    tier: "gold",
    category: "verification",
  },
  {
    id: "verified-10",
    label: "Proven Builder",
    description: "Appeared on 10 peer-verified published builds.",
    tier: "platinum",
    category: "verification",
  },
  {
    id: "team-debut",
    label: "Team Debut",
    description: "Shipped your first multi-person published build.",
    tier: "bronze",
    category: "team",
  },
  {
    id: "team-player",
    label: "Team Player",
    description: "Shipped on 3 multi-person builds.",
    tier: "silver",
    category: "team",
  },
  {
    id: "team-veteran",
    label: "Team Veteran",
    description: "Shipped on 10 multi-person builds.",
    tier: "gold",
    category: "team",
  },
  {
    id: "solo-shipper",
    label: "Solo Shipper",
    description: "Published a solo public build.",
    tier: "bronze",
    category: "team",
  },
  {
    id: "first-attestation",
    label: "Seen",
    description: "Received your first peer signature on a published build.",
    tier: "bronze",
    category: "attestations",
  },
  {
    id: "attested-5",
    label: "Recognized",
    description: "Received 5 peer signatures across published builds.",
    tier: "silver",
    category: "attestations",
  },
  {
    id: "heavily-attested",
    label: "Heavily Attested",
    description: "Received 10 peer signatures across published builds.",
    tier: "gold",
    category: "attestations",
  },
  {
    id: "attested-25",
    label: "Widely Seen",
    description: "Received 25 peer signatures across published builds.",
    tier: "gold",
    category: "attestations",
  },
  {
    id: "attested-50",
    label: "Campus Known",
    description: "Received 50 peer signatures across published builds.",
    tier: "platinum",
    category: "attestations",
  },
  {
    id: "first-witness",
    label: "First Witness",
    description: "Gave a standing signature on a verified published build.",
    tier: "bronze",
    category: "witness",
  },
  {
    id: "reliable-witness",
    label: "Reliable Witness",
    description: "Gave 5 signatures that still stand on verified builds.",
    tier: "silver",
    category: "witness",
  },
  {
    id: "seasoned-witness",
    label: "Seasoned Witness",
    description: "Gave 25 signatures that still stand on verified builds.",
    tier: "gold",
    category: "witness",
  },
  {
    id: "streak-3",
    label: "Warm Start",
    description: "Maintained a 3-day build streak.",
    tier: "bronze",
    category: "streak",
  },
  {
    id: "streak-7",
    label: "Week on Fire",
    description: "Maintained a 7-day build streak.",
    tier: "bronze",
    category: "streak",
  },
  {
    id: "streak-14",
    label: "Fortnight Focus",
    description: "Maintained a 14-day build streak.",
    tier: "silver",
    category: "streak",
  },
  {
    id: "streak-30",
    label: "Month of Momentum",
    description: "Maintained a 30-day build streak.",
    tier: "gold",
    category: "streak",
  },
  {
    id: "streak-60",
    label: "Two-Month Grind",
    description: "Maintained a 60-day build streak.",
    tier: "gold",
    category: "streak",
  },
  {
    id: "streak-100",
    label: "Century Streak",
    description: "Maintained a 100-day build streak.",
    tier: "platinum",
    category: "streak",
  },
  {
    id: "log-10",
    label: "Build Journal",
    description: "Posted 10 substantive build-log updates.",
    tier: "bronze",
    category: "log",
  },
  {
    id: "log-50",
    label: "Working Log",
    description: "Posted 50 substantive build-log updates.",
    tier: "silver",
    category: "log",
  },
  {
    id: "log-100",
    label: "Deep Log",
    description: "Posted 100 substantive build-log updates.",
    tier: "gold",
    category: "log",
  },
  {
    id: "log-500",
    label: "Archive Builder",
    description: "Posted 500 substantive build-log updates.",
    tier: "platinum",
    category: "log",
  },
  {
    id: "open-brief",
    label: "Open Brief",
    description: "Has a public active build open for collaborators.",
    tier: "bronze",
    category: "leadership",
  },
  {
    id: "stack-3",
    label: "Stack Curious",
    description: "Published builds covering 3 distinct stack tags.",
    tier: "bronze",
    category: "stack",
  },
  {
    id: "polymath",
    label: "Polymath",
    description: "Published builds covering 8 distinct stack tags.",
    tier: "silver",
    category: "stack",
  },
  {
    id: "stack-15",
    label: "Stack Omnivore",
    description: "Published builds covering 15 distinct stack tags.",
    tier: "gold",
    category: "stack",
  },
  {
    id: "collab-captain",
    label: "Collab Captain",
    description: "Owned 2 verified multi-person published builds.",
    tier: "gold",
    category: "leadership",
  },
  {
    id: "fleet-captain",
    label: "Fleet Captain",
    description: "Owned 5 verified multi-person published builds.",
    tier: "gold",
    category: "leadership",
  },
  {
    id: "legend-captain",
    label: "Legend Captain",
    description: "Owned 10 verified multi-person published builds.",
    tier: "platinum",
    category: "leadership",
  },
];

const BADGE_BY_ID = new Map(BADGE_CATALOG.map((badge) => [badge.id, badge]));

export function badgeDefinition(id: BadgeId): BadgeDefinition {
  return BADGE_BY_ID.get(id)!;
}

export type BuilderStatsInput = {
  userId: string;
  timezone?: string;
  memberships: Array<{
    role: "OWNER" | "MEMBER";
    project: {
      status: "ACTIVE" | "COMPLETED";
      visibility: "PUBLIC" | "PRIVATE";
      publishedAt: Date | null;
      techStack: string[];
      ownerId: string;
      members: Array<{ userId: string }>;
      signatures: Array<{
        signerId: string;
        subjectId: string;
        revokedAt: Date | null;
      }>;
      updates: Array<{ body: string; createdAt: Date; authorId: string }>;
    };
  }>;
};

export type BuilderStats = {
  publishedCount: number;
  verifiedPublishedCount: number;
  multiPersonPublishedCount: number;
  soloPublishedCount: number;
  ownedVerifiedPublishedCount: number;
  attestationsReceived: number;
  attestationsGivenOnVerified: number;
  openPublicActiveCount: number;
  distinctTechTags: number;
  currentStreak: number;
  longestStreak: number;
  realUpdateCount: number;
};

function isVerifiedPublished(project: BuilderStatsInput["memberships"][number]["project"]): boolean {
  if (!project.publishedAt || project.status !== "COMPLETED" || project.visibility !== "PUBLIC") {
    return false;
  }
  const memberIds = project.members.map((member) => member.userId);
  if (memberIds.length < 2) return false;
  const members = new Set(memberIds);
  const active = project.signatures.filter(
    (signature) =>
      !signature.revokedAt &&
      signature.signerId !== signature.subjectId &&
      members.has(signature.signerId) &&
      members.has(signature.subjectId),
  );
  return memberIds.every((memberId) =>
    active.some((signature) => signature.subjectId === memberId),
  );
}

export function computeBuilderStats(input: BuilderStatsInput): BuilderStats {
  const published = input.memberships.filter(
    (row) =>
      row.project.publishedAt &&
      row.project.status === "COMPLETED" &&
      row.project.visibility === "PUBLIC",
  );
  const verifiedPublished = published.filter((row) => isVerifiedPublished(row.project));
  const multiPersonPublished = published.filter((row) => row.project.members.length >= 2);
  const soloPublished = published.filter((row) => row.project.members.length === 1);
  const ownedVerified = verifiedPublished.filter((row) => row.project.ownerId === input.userId);

  let attestationsReceived = 0;
  let attestationsGivenOnVerified = 0;
  for (const row of published) {
    for (const signature of row.project.signatures) {
      if (signature.revokedAt) continue;
      if (signature.subjectId === input.userId && signature.signerId !== input.userId) {
        attestationsReceived += 1;
      }
      if (
        signature.signerId === input.userId &&
        signature.subjectId !== input.userId &&
        isVerifiedPublished(row.project)
      ) {
        attestationsGivenOnVerified += 1;
      }
    }
  }

  const openPublicActiveCount = input.memberships.filter(
    (row) =>
      row.project.status === "ACTIVE" &&
      row.project.visibility === "PUBLIC" &&
      row.role === "OWNER",
  ).length;

  const tech = new Set<string>();
  for (const row of published) {
    for (const tag of row.project.techStack) {
      tech.add(tag.toLowerCase());
    }
  }

  const events: BuildEvent[] = [];
  let realUpdateCount = 0;
  for (const row of input.memberships) {
    for (const update of row.project.updates) {
      if (update.authorId !== input.userId) continue;
      if (SYSTEM_UPDATE_BODIES.has(update.body)) continue;
      if (update.body.trim().length < MIN_REAL_UPDATE_CHARS) continue;
      realUpdateCount += 1;
      events.push({ at: update.createdAt.toISOString() });
    }
  }
  const summary = summarizeActivity(buildActivityYear(events, input.timezone ?? "UTC"));

  return {
    publishedCount: published.length,
    verifiedPublishedCount: verifiedPublished.length,
    multiPersonPublishedCount: multiPersonPublished.length,
    soloPublishedCount: soloPublished.length,
    ownedVerifiedPublishedCount: ownedVerified.length,
    attestationsReceived,
    attestationsGivenOnVerified,
    openPublicActiveCount,
    distinctTechTags: tech.size,
    currentStreak: summary.currentStreak,
    longestStreak: summary.longestStreak,
    realUpdateCount,
  };
}

function streakReached(stats: BuilderStats, days: number): boolean {
  return stats.longestStreak >= days || stats.currentStreak >= days;
}

export function earnBadges(stats: BuilderStats): BadgeDefinition[] {
  const earned: BadgeId[] = [];
  if (stats.publishedCount >= 1) earned.push("first-ship");
  if (stats.publishedCount >= 3) earned.push("ships-3");
  if (stats.publishedCount >= 5) earned.push("ships-5");
  if (stats.publishedCount >= 10) earned.push("ships-10");
  if (stats.publishedCount >= 25) earned.push("ships-25");
  if (stats.publishedCount >= 50) earned.push("ships-50");
  if (stats.verifiedPublishedCount >= 1) earned.push("verified-builder");
  if (stats.verifiedPublishedCount >= 5) earned.push("verified-5");
  if (stats.verifiedPublishedCount >= 10) earned.push("verified-10");
  if (stats.multiPersonPublishedCount >= 1) earned.push("team-debut");
  if (stats.multiPersonPublishedCount >= 3) earned.push("team-player");
  if (stats.multiPersonPublishedCount >= 10) earned.push("team-veteran");
  if (stats.soloPublishedCount >= 1) earned.push("solo-shipper");
  if (stats.attestationsReceived >= 1) earned.push("first-attestation");
  if (stats.attestationsReceived >= 5) earned.push("attested-5");
  if (stats.attestationsReceived >= 10) earned.push("heavily-attested");
  if (stats.attestationsReceived >= 25) earned.push("attested-25");
  if (stats.attestationsReceived >= 50) earned.push("attested-50");
  if (stats.attestationsGivenOnVerified >= 1) earned.push("first-witness");
  if (stats.attestationsGivenOnVerified >= 5) earned.push("reliable-witness");
  if (stats.attestationsGivenOnVerified >= 25) earned.push("seasoned-witness");
  if (streakReached(stats, 3)) earned.push("streak-3");
  if (streakReached(stats, 7)) earned.push("streak-7");
  if (streakReached(stats, 14)) earned.push("streak-14");
  if (streakReached(stats, 30)) earned.push("streak-30");
  if (streakReached(stats, 60)) earned.push("streak-60");
  if (streakReached(stats, 100)) earned.push("streak-100");
  if (stats.realUpdateCount >= 10) earned.push("log-10");
  if (stats.realUpdateCount >= 50) earned.push("log-50");
  if (stats.realUpdateCount >= 100) earned.push("log-100");
  if (stats.realUpdateCount >= 500) earned.push("log-500");
  if (stats.openPublicActiveCount >= 1) earned.push("open-brief");
  if (stats.distinctTechTags >= 3) earned.push("stack-3");
  if (stats.distinctTechTags >= 8) earned.push("polymath");
  if (stats.distinctTechTags >= 15) earned.push("stack-15");
  if (stats.ownedVerifiedPublishedCount >= 2) earned.push("collab-captain");
  if (stats.ownedVerifiedPublishedCount >= 5) earned.push("fleet-captain");
  if (stats.ownedVerifiedPublishedCount >= 10) earned.push("legend-captain");
  return earned.map(badgeDefinition);
}

export type StandingBoardId =
  | "verified-ships"
  | "published-ships"
  | "witnesses"
  | "streak"
  | "recent-ships"
  | "team-ships";

export type StandingBoard = {
  id: StandingBoardId;
  title: string;
  description: string;
  metric: string;
};

export const STANDING_BOARDS: StandingBoard[] = [
  {
    id: "verified-ships",
    title: "Verified ships",
    description: "Builders with the most peer-verified published builds.",
    metric: "Verified",
  },
  {
    id: "published-ships",
    title: "Total ships",
    description: "Most public proofs published.",
    metric: "Ships",
  },
  {
    id: "witnesses",
    title: "Top witnesses",
    description: "Standing signatures given on verified published builds.",
    metric: "Witnessed",
  },
  {
    id: "streak",
    title: "Longest streak",
    description: "Current build-log streak across real updates.",
    metric: "Streak",
  },
  {
    id: "team-ships",
    title: "Team ships",
    description: "Multi-person published builds.",
    metric: "Team",
  },
  {
    id: "recent-ships",
    title: "Recently shipped",
    description: "Public proofs published in the last 30 days.",
    metric: "30d ships",
  },
];
