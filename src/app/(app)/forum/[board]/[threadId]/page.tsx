import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/layout";
import { requireOnboardedUser } from "@/lib/current-user";
import { authorSelect, buildCommentTree, forumThreadPath, POST_PAGE_SIZE } from "@/lib/forum";
import { requireForumBoard } from "@/lib/forum-server";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { BoardStrip, ForumSubnav, ForumToolbar } from "../../forum-chrome";
import { NestedComments, OpeningPost } from "../../nested-comments";
import { LockThreadButton, RecordThreadView, ReplyForm } from "../../thread-controls";

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ board: string; threadId: string }>;
}) {
  const viewer = await requireOnboardedUser();
  const { board: boardSlug, threadId } = await params;
  const board = await requireForumBoard(boardSlug);

  const thread = await prisma.forumThread.findFirst({
    where: { id: threadId, deletedAt: null },
    select: {
      id: true,
      title: true,
      tags: true,
      locked: true,
      replyCount: true,
      viewCount: true,
      authorId: true,
      board: { select: { slug: true, title: true } },
      project: {
        select: {
          id: true,
          name: true,
          visibility: true,
          slug: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!thread) notFound();
  if (thread.board.slug !== board.slug) {
    redirect(forumThreadPath(thread.board.slug, thread.id));
  }

  const [posts, viewerProjects] = await Promise.all([
    prisma.forumPost.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
      take: POST_PAGE_SIZE,
      select: {
        id: true,
        parentId: true,
        body: true,
        score: true,
        editedAt: true,
        deletedAt: true,
        createdAt: true,
        authorId: true,
        author: { select: authorSelect },
        votes: {
          where: { userId: viewer.id },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.project.findMany({
      where: { ...memberProjectWhere(viewer.id), status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  const tree = buildCommentTree(
    posts.map((post) => ({
      id: post.id,
      parentId: post.parentId,
      body: post.body,
      score: post.score,
      editedAt: post.editedAt,
      deletedAt: post.deletedAt,
      createdAt: post.createdAt,
      authorId: post.authorId,
      author: post.author,
      voted: post.votes.length > 0,
    })),
  );

  const projectHref =
    thread.project?.visibility === "PUBLIC" && thread.project.publishedAt && thread.project.slug
      ? `/b/${thread.project.slug}`
      : thread.project
        ? `/projects/${thread.project.id}`
        : null;
  const invite = {
    viewerId: viewer.id,
    viewerPrivate: viewer.profilePrivate,
    viewerSkills: viewer.skills,
    viewerInterests: viewer.interests,
    projects: viewerProjects,
    enabled: board.slug === "looking-for-partners",
  };

  return (
    <div className="flex flex-col gap-4">
      <RecordThreadView threadId={thread.id} />
      <ForumSubnav active="threads" />
      <BoardStrip activeSlug={board.slug} />
      <ForumToolbar
        sort="hot"
        hrefForSort={() => `/forum/${board.slug}`}
        composeHref={`/forum/${board.slug}/new`}
      />
      <div>
        <p className="text-app-meta text-[13px] font-semibold tracking-[0.1em] uppercase">
          <Link href={`/forum/${board.slug}`} className="text-forum-blue hover:underline">
            {board.title}
          </Link>
        </p>
        <h1 className="text-app-ink mt-1 text-[1.75rem] leading-tight font-bold tracking-tight">
          {thread.title}
        </h1>
        <div className="text-app-meta mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span>{thread.replyCount} replies</span>
          <span>{thread.viewCount} views</span>
          {thread.locked ? <span>locked</span> : null}
          {thread.project && projectHref ? (
            <Link href={projectHref} className="text-forum-blue hover:underline">
              {thread.project.name}
            </Link>
          ) : null}
          {thread.authorId === viewer.id ? (
            <LockThreadButton threadId={thread.id} locked={thread.locked} />
          ) : null}
        </div>
        {thread.tags.length ? (
          <p className="text-app-meta mt-1 text-xs font-semibold tracking-[0.08em] uppercase">
            {thread.tags.join(" · ")}
          </p>
        ) : null}
      </div>

      {tree.opening ? (
        <OpeningPost
          post={tree.opening}
          threadId={thread.id}
          locked={thread.locked}
          viewerId={viewer.id}
          invite={invite}
        />
      ) : null}

      {tree.roots.length ? (
        <NestedComments
          threadId={thread.id}
          locked={thread.locked}
          viewerId={viewer.id}
          roots={tree.roots}
          invite={invite}
        />
      ) : null}

      {thread.locked ? (
        <EmptyState eyebrow="Locked" title="This thread is locked." />
      ) : (
        <ReplyForm threadId={thread.id} />
      )}
    </div>
  );
}
