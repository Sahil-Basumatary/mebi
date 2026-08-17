import "server-only";

import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import {
  FORUM_BOARDS,
  forumThreadOrder,
  HOT_POOL,
  isForumBoardSlug,
  THREAD_PAGE_SIZE,
  threadHotScore,
  threadListSelect,
  toThreadListItem,
  type ForumSort,
  type ThreadListItem,
} from "@/lib/forum";
import { prisma } from "@/lib/prisma";

export async function ensureForumBoards() {
  await prisma.$transaction(
    FORUM_BOARDS.map((board) =>
      prisma.forumBoard.upsert({
        where: { slug: board.slug },
        create: board,
        update: {
          title: board.title,
          description: board.description,
          sortOrder: board.sortOrder,
        },
      }),
    ),
  );
}

export async function requireForumBoard(slug: string) {
  if (!isForumBoardSlug(slug)) notFound();
  await ensureForumBoards();
  const board = await prisma.forumBoard.findUnique({ where: { slug } });
  if (!board) notFound();
  return board;
}

async function authorPostCounts(authorIds: string[]) {
  const unique = [...new Set(authorIds)];
  if (!unique.length) return new Map<string, number>();
  const rows = await prisma.forumPost.groupBy({
    by: ["authorId"],
    where: { authorId: { in: unique }, deletedAt: null },
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.authorId, row._count._all]));
}

export async function loadThreadList(input: {
  where: Prisma.ForumThreadWhereInput;
  sort: ForumSort;
  page: number;
  viewerId: string;
}): Promise<{ threads: ThreadListItem[]; total: number; pageCount: number }> {
  const page = Math.max(1, input.page);
  const hydrate = async (rows: Parameters<typeof toThreadListItem>[0][]) => {
    const counts = await authorPostCounts(rows.map((row) => row.author.id));
    const openingIds = rows.map((row) => row.posts[0]?.id).filter(Boolean);
    const votes = openingIds.length
      ? await prisma.forumPostVote.findMany({
          where: { userId: input.viewerId, postId: { in: openingIds } },
          select: { postId: true },
        })
      : [];
    const voted = new Set(votes.map((vote) => vote.postId));
    return rows.map((row) =>
      toThreadListItem(
        row,
        counts.get(row.author.id) ?? 0,
        Boolean(row.posts[0]?.id && voted.has(row.posts[0].id)),
      ),
    );
  };

  if (input.sort === "hot") {
    const pool = await prisma.forumThread.findMany({
      where: input.where,
      orderBy: [{ lastPostedAt: "desc" }, { id: "desc" }],
      take: HOT_POOL,
      select: threadListSelect,
    });
    pool.sort(
      (a, b) => threadHotScore(b.score, b.lastPostedAt) - threadHotScore(a.score, a.lastPostedAt),
    );
    const total = pool.length;
    const slice = pool.slice((page - 1) * THREAD_PAGE_SIZE, page * THREAD_PAGE_SIZE);
    return {
      threads: await hydrate(slice),
      total,
      pageCount: Math.max(1, Math.ceil(total / THREAD_PAGE_SIZE)),
    };
  }

  const [total, rows] = await Promise.all([
    prisma.forumThread.count({ where: input.where }),
    prisma.forumThread.findMany({
      where: input.where,
      orderBy: forumThreadOrder(input.sort),
      skip: (page - 1) * THREAD_PAGE_SIZE,
      take: THREAD_PAGE_SIZE,
      select: threadListSelect,
    }),
  ]);
  return {
    threads: await hydrate(rows),
    total,
    pageCount: Math.max(1, Math.ceil(total / THREAD_PAGE_SIZE)),
  };
}
