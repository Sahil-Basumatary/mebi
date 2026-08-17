"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/current-user";
import {
  BODY_MAX,
  BURST_WINDOW_MS,
  forumThreadPath,
  HOUR_MS,
  isForumBoardSlug,
  MAX_REPLY_DEPTH,
  parseForumBody,
  parseForumTags,
  parseForumTitle,
  POSTS_BURST,
  POSTS_PER_HOUR,
  THREADS_PER_HOUR,
  TITLE_MAX,
  VOTES_BURST,
} from "@/lib/forum";
import { ensureForumBoards } from "@/lib/forum-server";
import { getProjectMembership } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";

export type ForumFormState = {
  error: string | null;
  doneAt?: number;
};

function getField(rawValue: FormDataEntryValue | null, maxLength: number): string | null {
  if (typeof rawValue !== "string") return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function revalidateThread(boardSlug: string, threadId: string) {
  revalidatePath("/forum");
  revalidatePath(`/forum/${boardSlug}`);
  revalidatePath(forumThreadPath(boardSlug, threadId));
  revalidatePath("/inbox");
}

async function loadThreadForWrite(threadId: string) {
  return prisma.forumThread.findFirst({
    where: { id: threadId, deletedAt: null },
    select: {
      id: true,
      authorId: true,
      locked: true,
      title: true,
      board: { select: { slug: true } },
    },
  });
}

export async function createThread(
  _previous: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const viewer = await requireOnboardedUser();
  const boardSlug = getField(formData.get("boardSlug"), 40);
  if (!boardSlug || !isForumBoardSlug(boardSlug)) {
    return { error: "Pick a board for this thread." };
  }
  await ensureForumBoards();
  const board = await prisma.forumBoard.findUnique({ where: { slug: boardSlug } });
  if (!board) return { error: "That board does not exist." };
  const title = parseForumTitle(getField(formData.get("title"), TITLE_MAX));
  if ("error" in title) return { error: title.error };
  const body = parseForumBody(getField(formData.get("body"), BODY_MAX));
  if ("error" in body) return { error: body.error };
  const tags = parseForumTags(getField(formData.get("tags"), 200));
  if ("error" in tags) return { error: tags.error };

  const projectId = getField(formData.get("projectId"), 60);
  if (projectId) {
    const membership = await getProjectMembership(projectId, viewer.id);
    if (!membership) {
      return { error: "You can only attach a build you belong to." };
    }
  }

  const hourAgo = new Date(Date.now() - HOUR_MS);
  const recentThreads = await prisma.forumThread.count({
    where: { authorId: viewer.id, createdAt: { gte: hourAgo } },
  });
  if (recentThreads >= THREADS_PER_HOUR) {
    return { error: "Hourly thread limit reached." };
  }

  const thread = await prisma.$transaction(async (tx) => {
    const created = await tx.forumThread.create({
      data: {
        boardId: board.id,
        authorId: viewer.id,
        projectId,
        title: title.value,
        tags: tags.value,
        lastPostedAt: new Date(),
        lastPostAuthorId: viewer.id,
      },
      select: { id: true },
    });
    const opening = await tx.forumPost.create({
      data: {
        threadId: created.id,
        authorId: viewer.id,
        body: body.value,
      },
      select: { id: true },
    });
    await tx.forumThread.update({
      where: { id: created.id },
      data: { lastPostId: opening.id },
    });
    return created;
  });

  revalidateThread(board.slug, thread.id);
  redirect(forumThreadPath(board.slug, thread.id));
}

export async function replyToThread(
  _previous: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const viewer = await requireOnboardedUser();
  const threadId = getField(formData.get("threadId"), 60);
  const body = parseForumBody(getField(formData.get("body"), BODY_MAX));
  if (!threadId) return { error: "Thread not found." };
  if ("error" in body) return { error: body.error };

  const thread = await loadThreadForWrite(threadId);
  if (!thread) return { error: "This thread is gone." };
  if (thread.locked) return { error: "This thread is locked." };

  const parentId = getField(formData.get("parentPostId"), 60);
  let parentAuthorId: string | null = null;
  if (parentId) {
    const parent = await prisma.forumPost.findFirst({
      where: { id: parentId, threadId: thread.id },
      select: { id: true, authorId: true, parentId: true },
    });
    if (!parent) return { error: "That post is gone." };
    parentAuthorId = parent.authorId;
    let depth = 0;
    let cursor = parent.parentId;
    const seen = new Set<string>([parent.id]);
    while (cursor && depth < MAX_REPLY_DEPTH + 2) {
      if (seen.has(cursor)) break;
      seen.add(cursor);
      const next = await prisma.forumPost.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      if (!next?.parentId) break;
      cursor = next.parentId;
      depth += 1;
    }
    if (depth >= MAX_REPLY_DEPTH) {
      return { error: "Maximum reply depth reached." };
    }
  }

  const now = Date.now();
  const [hourCount, burstCount] = await Promise.all([
    prisma.forumPost.count({
      where: { authorId: viewer.id, createdAt: { gte: new Date(now - HOUR_MS) } },
    }),
    prisma.forumPost.count({
      where: { authorId: viewer.id, createdAt: { gte: new Date(now - BURST_WINDOW_MS) } },
    }),
  ]);
  if (burstCount >= POSTS_BURST) {
    return { error: "Posting rate limit reached. Try again shortly." };
  }
  if (hourCount >= POSTS_PER_HOUR) {
    return { error: "You've hit the hourly reply limit." };
  }

  const senderName = displayName(viewer.fullName, viewer.username);
  await prisma.$transaction(async (tx) => {
    const post = await tx.forumPost.create({
      data: {
        threadId: thread.id,
        authorId: viewer.id,
        parentId,
        body: body.value,
      },
      select: { id: true },
    });
    await tx.forumThread.update({
      where: { id: thread.id },
      data: {
        replyCount: { increment: 1 },
        lastPostedAt: new Date(),
        lastPostAuthorId: viewer.id,
        lastPostId: post.id,
      },
    });
    const notifyIds = new Set<string>();
    if (parentAuthorId && parentAuthorId !== viewer.id) notifyIds.add(parentAuthorId);
    if (thread.authorId !== viewer.id) notifyIds.add(thread.authorId);
    const href = `${forumThreadPath(thread.board.slug, thread.id)}#${post.id}`;
    for (const userId of notifyIds) {
      await tx.notification.create({
        data: {
          userId,
          type: "FORUM_REPLY",
          message:
            userId === parentAuthorId
              ? `${senderName} replied to you in ${thread.title}.`
              : `${senderName} replied in ${thread.title}.`,
          actorName: senderName,
          href,
        },
      });
    }
  });

  revalidateThread(thread.board.slug, thread.id);
  return { error: null, doneAt: Date.now() };
}

export async function editPost(
  _previous: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const viewer = await requireOnboardedUser();
  const postId = getField(formData.get("postId"), 60);
  const body = parseForumBody(getField(formData.get("body"), BODY_MAX));
  if (!postId) return { error: "Post not found." };
  if ("error" in body) return { error: body.error };

  const post = await prisma.forumPost.findFirst({
    where: { id: postId, authorId: viewer.id, deletedAt: null },
    select: {
      id: true,
      thread: {
        select: {
          id: true,
          deletedAt: true,
          locked: true,
          board: { select: { slug: true } },
        },
      },
    },
  });
  if (!post || post.thread.deletedAt) return { error: "This post can no longer be edited." };
  if (post.thread.locked) return { error: "Locked threads can't be edited." };

  await prisma.forumPost.update({
    where: { id: post.id },
    data: { body: body.value, editedAt: new Date() },
  });

  revalidateThread(post.thread.board.slug, post.thread.id);
  return { error: null, doneAt: Date.now() };
}

export async function deletePost(formData: FormData): Promise<void> {
  const viewer = await requireOnboardedUser();
  const postId = getField(formData.get("postId"), 60);
  if (!postId) return;

  const post = await prisma.forumPost.findFirst({
    where: { id: postId, authorId: viewer.id, deletedAt: null },
    select: {
      id: true,
      threadId: true,
      createdAt: true,
      thread: {
        select: {
          id: true,
          authorId: true,
          deletedAt: true,
          replyCount: true,
          board: { select: { slug: true } },
        },
      },
    },
  });
  if (!post || post.thread.deletedAt) return;

  const opening = await prisma.forumPost.findFirst({
    where: { threadId: post.threadId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const isOpening = opening?.id === post.id;

  await prisma.$transaction(async (tx) => {
    await tx.forumPost.update({
      where: { id: post.id },
      data: { deletedAt: new Date(), body: "" },
    });

    if (isOpening) {
      await tx.forumThread.update({
        where: { id: post.threadId },
        data: { deletedAt: new Date(), locked: true },
      });
      return;
    }

    const last = await tx.forumPost.findFirst({
      where: { threadId: post.threadId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, authorId: true, createdAt: true },
    });
    await tx.forumThread.update({
      where: { id: post.threadId },
      data: {
        replyCount: Math.max(0, post.thread.replyCount - 1),
        lastPostedAt: last?.createdAt ?? new Date(),
        lastPostAuthorId: last?.authorId ?? null,
        lastPostId: last?.id ?? null,
      },
    });
  });

  revalidateThread(post.thread.board.slug, post.thread.id);
}

export async function toggleThreadLock(formData: FormData): Promise<void> {
  const viewer = await requireOnboardedUser();
  const threadId = getField(formData.get("threadId"), 60);
  if (!threadId) return;

  const thread = await loadThreadForWrite(threadId);
  if (!thread || thread.authorId !== viewer.id) return;

  await prisma.forumThread.update({
    where: { id: thread.id },
    data: { locked: !thread.locked },
  });
  revalidateThread(thread.board.slug, thread.id);
}

export async function togglePostVote(formData: FormData): Promise<void> {
  const viewer = await requireOnboardedUser();
  const postId = getField(formData.get("postId"), 60);
  if (!postId) return;

  const post = await prisma.forumPost.findFirst({
    where: { id: postId, deletedAt: null },
    select: {
      id: true,
      authorId: true,
      threadId: true,
      createdAt: true,
      thread: {
        select: {
          id: true,
          deletedAt: true,
          board: { select: { slug: true } },
        },
      },
    },
  });
  if (!post || post.thread.deletedAt) return;
  if (post.authorId === viewer.id) return;

  const burst = await prisma.forumPostVote.count({
    where: {
      userId: viewer.id,
      createdAt: { gte: new Date(Date.now() - BURST_WINDOW_MS) },
    },
  });
  if (burst >= VOTES_BURST) return;

  const existing = await prisma.forumPostVote.findUnique({
    where: { postId_userId: { postId: post.id, userId: viewer.id } },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.forumPostVote.delete({ where: { id: existing.id } });
      await tx.forumPost.update({
        where: { id: post.id },
        data: { score: { decrement: 1 } },
      });
    } else {
      await tx.forumPostVote.create({
        data: { postId: post.id, userId: viewer.id },
      });
      await tx.forumPost.update({
        where: { id: post.id },
        data: { score: { increment: 1 } },
      });
    }
    const earlier = await tx.forumPost.findFirst({
      where: { threadId: post.threadId, createdAt: { lt: post.createdAt } },
      select: { id: true },
    });
    if (!earlier) {
      const opening = await tx.forumPost.findUnique({
        where: { id: post.id },
        select: { score: true },
      });
      await tx.forumThread.update({
        where: { id: post.thread.id },
        data: { score: opening?.score ?? 0 },
      });
    }
  });

  revalidateThread(post.thread.board.slug, post.thread.id);
}

export async function recordThreadView(threadId: string): Promise<void> {
  if (!threadId || threadId.length > 60) return;
  await requireOnboardedUser();
  await prisma.forumThread.updateMany({
    where: { id: threadId, deletedAt: null },
    data: { viewCount: { increment: 1 } },
  });
}
