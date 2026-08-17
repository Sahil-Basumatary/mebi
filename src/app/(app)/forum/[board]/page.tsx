import Link from "next/link";
import { EmptyState } from "@/components/layout";
import { requireOnboardedUser } from "@/lib/current-user";
import { parseForumSort, THREAD_PAGE_SIZE, type ForumSort } from "@/lib/forum";
import { loadThreadList, requireForumBoard } from "@/lib/forum-server";
import { BoardStrip, ForumSubnav, ForumToolbar } from "../forum-chrome";
import { ForumPager, ThreadTable } from "../thread-table";

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ForumBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ board: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await requireOnboardedUser();
  const { board: boardSlug } = await params;
  const board = await requireForumBoard(boardSlug);
  const queryParams = await searchParams;
  const query = first(queryParams.q).trim().slice(0, 80);
  const sort = parseForumSort(first(queryParams.sort));
  const mine = first(queryParams.scope) === "you";
  const page = Math.max(1, Number.parseInt(first(queryParams.page) || "1", 10) || 1);

  const where = {
    boardId: board.id,
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

  const { threads, total, pageCount } = await loadThreadList({
    where,
    sort,
    page,
    viewerId: viewer.id,
  });

  function hrefForSort(next: ForumSort) {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (mine) qs.set("scope", "you");
    if (next !== "hot") qs.set("sort", next);
    const encoded = qs.toString();
    return encoded ? `/forum/${board.slug}?${encoded}` : `/forum/${board.slug}`;
  }

  function hrefForPage(nextPage: number) {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (mine) qs.set("scope", "you");
    if (sort !== "hot") qs.set("sort", sort);
    if (nextPage > 1) qs.set("page", String(nextPage));
    const encoded = qs.toString();
    return encoded ? `/forum/${board.slug}?${encoded}` : `/forum/${board.slug}`;
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ForumSubnav active="threads" />
      <BoardStrip activeSlug={board.slug} />
      <form action={`/forum/${board.slug}`} className="border-app-divider flex border">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={`Search ${board.title}`}
          className="text-app-ink placeholder:text-app-muted min-w-0 flex-1 px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="bg-app-ink text-app-paper px-4 text-sm font-semibold tracking-[0.08em] uppercase"
        >
          Search
        </button>
      </form>
      <ForumToolbar
        sort={sort}
        hrefForSort={hrefForSort}
        composeHref={`/forum/${board.slug}/new`}
      />
      <p className="text-app-meta text-sm">
        {board.description}
        {total ? ` · ${total} thread${total === 1 ? "" : "s"}` : ""}
      </p>
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
          eyebrow={query ? "No matches" : "Empty board"}
          title={query ? "Nothing matched that search." : `No threads in ${board.title} yet.`}
          action={
            <Link
              href={`/forum/${board.slug}/new`}
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
