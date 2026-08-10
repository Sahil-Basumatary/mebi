import { computeBuilderStats, earnBadges, type BadgeDefinition, type StandingBoardId } from "@/lib/badges";
import { resolveTimezone } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

const membershipSelect = {
  role: true as const,
  project: {
    select: {
      status: true as const,
      visibility: true as const,
      publishedAt: true,
      techStack: true,
      ownerId: true,
      members: { select: { userId: true } },
      signatures: {
        select: { signerId: true, subjectId: true, revokedAt: true },
      },
      updates: {
        select: { body: true, createdAt: true, authorId: true },
      },
    },
  },
};

export async function getBadgesForUser(
  userId: string,
  timezone = "UTC",
): Promise<{ badges: BadgeDefinition[]; stats: ReturnType<typeof computeBuilderStats> }> {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: membershipSelect,
  });

  const stats = computeBuilderStats({
    userId,
    timezone,
    memberships,
  });

  return { badges: earnBadges(stats), stats };
}

export type StandingRow = {
  userId: string;
  fullName: string | null;
  username: string | null;
  imageUrl: string | null;
  value: number;
  detail: string;
  rank: number;
};

export type StandingBoardResult = {
  rows: StandingRow[];
  viewer: StandingRow | null;
};

function withCompetitionRanks(rows: StandingRow[]): StandingRow[] {
  let rank = 1;
  return rows.map((row, index) => {
    if (index > 0 && row.value < rows[index - 1].value) {
      rank = index + 1;
    }
    return { ...row, rank };
  });
}

function scoreBoardRow(
  board: StandingBoardId,
  user: {
    id: string;
    fullName: string | null;
    username: string | null;
    imageUrl: string | null;
    timezone: string | null;
    memberships: Parameters<typeof computeBuilderStats>[0]["memberships"];
  },
  recentCount?: number,
): StandingRow {
  if (board === "recent-ships") {
    const value = recentCount ?? 0;
    return {
      userId: user.id,
      fullName: user.fullName,
      username: user.username,
      imageUrl: user.imageUrl,
      value,
      detail: value === 1 ? "1 ship" : `${value} ships`,
      rank: 0,
    };
  }

  const stats = computeBuilderStats({
    userId: user.id,
    timezone: resolveTimezone(user.timezone ?? "UTC"),
    memberships: user.memberships,
  });

  if (board === "verified-ships") {
    return {
      userId: user.id,
      fullName: user.fullName,
      username: user.username,
      imageUrl: user.imageUrl,
      value: stats.verifiedPublishedCount,
      detail: `${stats.verifiedPublishedCount} verified`,
      rank: 0,
    };
  }

  if (board === "published-ships") {
    return {
      userId: user.id,
      fullName: user.fullName,
      username: user.username,
      imageUrl: user.imageUrl,
      value: stats.publishedCount,
      detail: `${stats.publishedCount} ships`,
      rank: 0,
    };
  }

  if (board === "witnesses") {
    return {
      userId: user.id,
      fullName: user.fullName,
      username: user.username,
      imageUrl: user.imageUrl,
      value: stats.attestationsGivenOnVerified,
      detail: `${stats.attestationsGivenOnVerified} witnessed`,
      rank: 0,
    };
  }

  if (board === "team-ships") {
    return {
      userId: user.id,
      fullName: user.fullName,
      username: user.username,
      imageUrl: user.imageUrl,
      value: stats.multiPersonPublishedCount,
      detail: `${stats.multiPersonPublishedCount} team ships`,
      rank: 0,
    };
  }

  return {
    userId: user.id,
    fullName: user.fullName,
    username: user.username,
    imageUrl: user.imageUrl,
    value: stats.currentStreak,
    detail: `${stats.currentStreak}-day streak`,
    rank: 0,
  };
}

export async function getStandingBoard(
  board: StandingBoardId,
  viewerId?: string,
  limit = 20,
): Promise<StandingBoardResult> {
  if (board === "recent-ships") {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const projects = await prisma.project.findMany({
      where: {
        publishedAt: { gte: since },
        status: "COMPLETED",
        visibility: "PUBLIC",
        owner: { onboarded: true, profilePrivate: false },
      },
      orderBy: { publishedAt: "desc" },
      take: 80,
      select: {
        publishedAt: true,
        owner: {
          select: { id: true, fullName: true, username: true, imageUrl: true, timezone: true },
        },
      },
    });

    const counts = new Map<string, StandingRow>();
    for (const project of projects) {
      const owner = project.owner;
      const current = counts.get(owner.id);
      if (current) {
        current.value += 1;
        current.detail = `${current.value} ships`;
      } else {
        counts.set(owner.id, {
          userId: owner.id,
          fullName: owner.fullName,
          username: owner.username,
          imageUrl: owner.imageUrl,
          value: 1,
          detail: "1 ship",
          rank: 0,
        });
      }
    }

    const ranked = withCompetitionRanks(
      [...counts.values()].sort((a, b) => b.value - a.value),
    );
    const rows = ranked.slice(0, limit);
    const viewer = viewerId
      ? ranked.find((row) => row.userId === viewerId) ?? null
      : null;
    return { rows, viewer };
  }

  const users = await prisma.user.findMany({
    where: { onboarded: true, profilePrivate: false },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      fullName: true,
      username: true,
      imageUrl: true,
      timezone: true,
      memberships: { select: membershipSelect },
    },
  });

  const ranked = withCompetitionRanks(
    users
      .map((user) => scoreBoardRow(board, user))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value),
  );
  const rows = ranked.slice(0, limit);
  const viewer = viewerId
    ? ranked.find((row) => row.userId === viewerId) ?? null
    : null;
  return { rows, viewer };
}
