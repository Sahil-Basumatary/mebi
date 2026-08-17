import Link from "next/link";
import { EmptyState } from "@/components/layout";
import { requireOnboardedUser } from "@/lib/current-user";
import {
  FORUM_BOARDS,
  formatForumTime,
  forumThreadPath,
  parseForumSort,
  profileHref,
  THREAD_PAGE_SIZE,
  type ForumSort,
} from "@/lib/forum";
import { ensureForumBoards, loadThreadList } from "@/lib/forum-server";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";
import { BoardStrip, ForumSubnav, ForumToolbar } from "./forum-chrome";
import { ForumPager, ThreadTable } from "./thread-table";

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ForumIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await requireOnboardedUser();
  const params = await searchParams;
  const viewRaw = first(params.view);
  const view = viewRaw === "index" || viewRaw === "search" ? viewRaw : "threads";
  const query = first(params.q).trim().slice(0, 80);
  const sort = parseForumSort(first(params.sort));
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);
  const mine = first(params.scope) === "you";

  await ensureForumBoards();

  if (view === "index") {
    return <ForumBoardIndex />;
  }

  const where = {
    deletedAt: null,
    ...(mine ? { authorId: viewer.id } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            {
              posts: {
                some: {
                  deletedAt: null,
                  body: { contains: query, mode: "insensitive" as const },
                },
              },
            },
          ],
        }
      : {}),
  };

  const { threads, pageCount } = await loadThreadList({
    where,
    sort,
    page,
    viewerId: viewer.id,
  });

  function hrefForSort(next: ForumSort) {
    const qs = new URLSearchParams();
    if (view === "search") qs.set("view", "search");
    if (query) qs.set("q", query);
    if (mine) qs.set("scope", "you");
    if (next !== "hot") qs.set("sort", next);
    const encoded = qs.toString();
    return encoded ? `/forum?${encoded}` : "/forum";
  }

  function hrefForPage(nextPage: number) {
    const qs = new URLSearchParams();
    if (view === "search") qs.set("view", "search");
    if (query) qs.set("q", query);
    if (mine) qs.set("scope", "you");
    if (sort !== "hot") qs.set("sort", sort);
    if (nextPage > 1) qs.set("page", String(nextPage));
    const encoded = qs.toString();
    return encoded ? `/forum?${encoded}` : "/forum";
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ForumSubnav active={view === "search" ? "search" : "threads"} />
      <BoardStrip />
      {view === "search" || query ? (
        <form action="/forum" className="border-app-divider flex border">
          <input type="hidden" name="view" value="search" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search threads and posts"
            className="text-app-ink placeholder:text-app-muted min-w-0 flex-1 px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="bg-app-ink text-app-paper px-4 text-sm font-semibold tracking-[0.08em] uppercase"
          >
            Search
          </button>
        </form>
      ) : null}
      <ForumToolbar
        sort={sort}
        hrefForSort={hrefForSort}
        composeHref="/forum/looking-for-partners/new"
      />
      {threads.length ? (
        <>
          <ThreadTable
            threads={threads}
            startRank={(Math.min(page, pageCount) - 1) * THREAD_PAGE_SIZE + 1}
            viewerId={viewer.id}
          />
          <ForumPager
            page={Math.min(page, pageCount)}
            pageCount={pageCount}
            hrefFor={hrefForPage}
          />
        </>
      ) : (
        <EmptyState
          fill
          eyebrow={query ? "No matches" : "Quiet"}
          title={query ? "Nothing matched that search." : "No threads yet."}
          action={
            <Link
              href="/forum/looking-for-partners/new"
              className="bg-forum-red inline-flex h-10 items-center px-5 text-sm font-semibold text-white"
            >
              Start Thread
            </Link>
          }
        />
      )}
    </div>
  );
}

async function ForumBoardIndex() {
  const [boards, replySums] = await Promise.all([
    prisma.forumBoard.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { threads: { where: { deletedAt: null } } } },
      },
    }),
    prisma.forumThread.groupBy({
      by: ["boardId"],
      where: { deletedAt: null },
      _sum: { replyCount: true },
    }),
  ]);
  const replyByBoard = new Map(replySums.map((row) => [row.boardId, row._sum.replyCount ?? 0]));
  const lastThreads = await Promise.all(
    FORUM_BOARDS.map((board) =>
      prisma.forumThread.findFirst({
        where: { deletedAt: null, board: { slug: board.slug } },
        orderBy: { lastPostedAt: "desc" },
        select: {
          id: true,
          title: true,
          lastPostedAt: true,
          lastPostId: true,
          board: { select: { slug: true } },
          lastPostAuthor: {
            select: { fullName: true, username: true, profilePrivate: true },
          },
        },
      }),
    ),
  );
  const lastBySlug = new Map(
    lastThreads.filter(Boolean).map((thread) => [thread!.board.slug, thread!]),
  );

  return (
    <div className="flex flex-col gap-4">
      <ForumSubnav active="index" />
      <ForumToolbar
        sort="hot"
        hrefForSort={() => "/forum"}
        composeHref="/forum/looking-for-partners/new"
      />
      <div
        role="table"
        aria-label="Forum boards"
        className="border-app-divider bg-app-paper divide-y border shadow-sm"
      >
        <div
          role="row"
          className="text-app-meta hidden grid-cols-[minmax(0,1.6fr)_4rem_4rem_minmax(8rem,1fr)] gap-4 px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase sm:grid"
        >
          <span role="columnheader">Board</span>
          <span role="columnheader" className="text-right">
            Threads
          </span>
          <span role="columnheader" className="text-right">
            Posts
          </span>
          <span role="columnheader" className="text-right">
            Latest activity
          </span>
        </div>
        {boards.map((board) => {
          const threadCount = board._count.threads;
          const posts = threadCount + (replyByBoard.get(board.id) ?? 0);
          const last = lastBySlug.get(board.slug);
          const lastHref = last
            ? last.lastPostId
              ? `${forumThreadPath(board.slug, last.id)}#${last.lastPostId}`
              : forumThreadPath(board.slug, last.id)
            : null;
          const lastAuthorHref = last?.lastPostAuthor ? profileHref(last.lastPostAuthor) : null;
          return (
            <div
              key={board.id}
              role="row"
              className="hover:bg-app-wash grid grid-cols-1 gap-1 px-3 py-3 sm:grid-cols-[minmax(0,1.6fr)_4rem_4rem_minmax(8rem,1fr)] sm:items-center sm:gap-4"
            >
              <div role="cell" className="min-w-0">
                <Link
                  href={`/forum/${board.slug}`}
                  className="text-forum-blue text-[17px] font-semibold hover:underline"
                >
                  {board.title}
                </Link>
                <p className="text-app-meta mt-0.5 text-sm leading-5">{board.description}</p>
              </div>
              <p role="cell" className="text-sm tabular-nums sm:text-right">
                <span className="text-app-meta mr-2 text-xs uppercase sm:hidden">Threads</span>
                {threadCount}
              </p>
              <p role="cell" className="text-sm tabular-nums sm:text-right">
                <span className="text-app-meta mr-2 text-xs uppercase sm:hidden">Posts</span>
                {posts}
              </p>
              <div role="cell" className="min-w-0 text-sm sm:text-right">
                {last && lastHref ? (
                  <>
                    <Link href={lastHref} className="text-forum-blue hover:underline">
                      {last.title}
                    </Link>
                    <p className="text-app-meta mt-0.5 text-sm">
                      {formatForumTime(last.lastPostedAt)}
                      {last.lastPostAuthor ? (
                        <>
                          {" · "}
                          {lastAuthorHref ? (
                            <Link href={lastAuthorHref} className="hover:underline">
                              {displayName(
                                last.lastPostAuthor.fullName,
                                last.lastPostAuthor.username,
                              )}
                            </Link>
                          ) : (
                            displayName(last.lastPostAuthor.fullName, last.lastPostAuthor.username)
                          )}
                        </>
                      ) : null}
                    </p>
                  </>
                ) : (
                  <span className="text-app-meta">No threads yet</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
