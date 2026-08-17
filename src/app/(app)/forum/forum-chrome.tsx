import Link from "next/link";
import { FORUM_BOARDS, type ForumSort } from "@/lib/forum";
import { cn } from "@/lib/utils";

export type ForumView = "threads" | "index" | "search";

const VIEWS: { id: ForumView; label: string; href: string }[] = [
  { id: "threads", label: "Threads", href: "/forum" },
  { id: "index", label: "Forum Index", href: "/forum?view=index" },
  { id: "search", label: "Search", href: "/forum?view=search" },
];

export const FORUM_SORTS: { id: ForumSort; label: string }[] = [
  { id: "hot", label: "Hot" },
  { id: "last", label: "Last reply" },
  { id: "new", label: "New" },
  { id: "replies", label: "Top replies" },
  { id: "views", label: "Views" },
];

export function ForumSubnav({ active }: { active: ForumView }) {
  return (
    <nav
      aria-label="Forum views"
      className="border-app-divider bg-app-wash flex flex-wrap items-stretch border"
    >
      {VIEWS.map((view) => {
        const current = view.id === active;
        return (
          <Link
            key={view.id}
            href={view.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "border-app-divider relative -mb-px border-r px-5 py-3 text-base font-semibold tracking-tight first:border-l",
              current
                ? "text-app-ink after:bg-forum-red after:absolute after:inset-x-0 after:bottom-0 after:h-[3px]"
                : "text-app-label hover:bg-app-paper hover:text-app-ink",
            )}
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ForumToolbar({
  sort,
  hrefForSort,
  composeHref,
  composeLabel = "Start Thread",
}: {
  sort: ForumSort;
  hrefForSort: (sort: ForumSort) => string;
  composeHref: string;
  composeLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <div className="text-app-meta flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
        <span>Sort by</span>
        {FORUM_SORTS.map((item) => (
          <Link
            key={item.id}
            href={hrefForSort(item.id)}
            aria-current={sort === item.id ? "page" : undefined}
            className={cn(
              sort === item.id
                ? "text-app-ink border-forum-red border-b border-dotted"
                : "hover:text-forum-blue",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <Link
        href={composeHref}
        className="bg-forum-red inline-flex h-10 items-center px-5 text-sm font-semibold text-white shadow-sm hover:brightness-95"
      >
        {composeLabel}
      </Link>
    </div>
  );
}

export function BoardStrip({ activeSlug }: { activeSlug?: string }) {
  return (
    <div className="text-app-meta flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold uppercase">
      <Link href="/forum" className={!activeSlug ? "text-forum-blue" : "hover:text-forum-blue"}>
        All
      </Link>
      {FORUM_BOARDS.map((board) => (
        <Link
          key={board.slug}
          href={`/forum/${board.slug}`}
          aria-current={activeSlug === board.slug ? "page" : undefined}
          className={activeSlug === board.slug ? "text-forum-blue" : "hover:text-forum-blue"}
        >
          {board.title}
        </Link>
      ))}
    </div>
  );
}
