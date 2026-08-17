import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatForumTime, forumThreadPath, profileHref, type ThreadListItem } from "@/lib/forum";
import { displayName } from "@/lib/user-display";
import { VoteControl } from "./thread-controls";

function AuthorLink({
  fullName,
  username,
  profilePrivate,
}: {
  fullName: string | null;
  username: string | null;
  profilePrivate: boolean;
}) {
  const name = displayName(fullName, username);
  const href = profileHref({ username, profilePrivate });
  if (!href) return <span className="text-forum-blue">{name}</span>;
  return (
    <Link href={href} className="text-forum-blue hover:underline">
      {name}
    </Link>
  );
}

export function ThreadTable({
  threads,
  startRank = 1,
  viewerId,
}: {
  threads: ThreadListItem[];
  startRank?: number;
  viewerId: string;
}) {
  return (
    <ol className="border-app-divider bg-app-paper divide-y border shadow-sm">
      {threads.map((thread, index) => {
        const href = forumThreadPath(thread.board.slug, thread.id);
        const lastHref = thread.lastPostId ? `${href}#${thread.lastPostId}` : href;
        const selfVote = thread.author.id === viewerId;
        return (
          <li
            key={thread.id}
            className="hover:bg-app-wash grid grid-cols-[2rem_2.5rem_minmax(0,1fr)] items-center gap-3 px-3 py-2.5 sm:grid-cols-[2.25rem_2.75rem_minmax(0,1fr)_11rem]"
          >
            <span className="text-app-meta text-right text-sm tabular-nums">
              {startRank + index}
            </span>
            <VoteControl
              postId={thread.openingPostId}
              score={thread.score}
              voted={thread.voted}
              disabled={selfVote}
              variant="box"
            />
            <div className="min-w-0">
              <p className="min-w-0 truncate text-[17px] leading-6">
                <Link href={href} className="text-forum-blue font-semibold hover:underline">
                  {thread.title}
                </Link>
                {thread.locked ? (
                  <span className="text-app-meta ml-2 text-xs font-semibold tracking-[0.08em] uppercase">
                    locked
                  </span>
                ) : null}
                <Link
                  href={`/forum/${thread.board.slug}`}
                  className="text-app-meta ml-2 text-xs font-semibold tracking-[0.08em] uppercase hover:underline"
                >
                  {thread.board.title}
                </Link>
              </p>
              <p className="text-app-meta mt-0.5 truncate text-sm">
                posted {formatForumTime(thread.createdAt)} by{" "}
                <AuthorLink
                  fullName={thread.author.fullName}
                  username={thread.author.username}
                  profilePrivate={thread.author.profilePrivate}
                />{" "}
                <span className="tabular-nums">{thread.authorPostCount}</span>
                {thread.replyCount > 0 ? (
                  <>
                    {" · "}
                    {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
                  </>
                ) : null}
              </p>
            </div>
            <div className="hidden min-w-0 items-center justify-end gap-2 text-right sm:flex">
              <div className="min-w-0">
                {thread.lastPostAuthor ? (
                  <p className="truncate text-sm">
                    <AuthorLink
                      fullName={thread.lastPostAuthor.fullName}
                      username={thread.lastPostAuthor.username}
                      profilePrivate={thread.lastPostAuthor.profilePrivate}
                    />
                  </p>
                ) : null}
                <p className="text-app-meta text-xs">{formatForumTime(thread.lastPostedAt)}</p>
              </div>
              <Link
                href={lastHref}
                aria-label="Jump to last reply"
                className="border-app-divider text-app-label hover:text-app-ink flex h-7 w-7 shrink-0 items-center justify-center border"
              >
                <ChevronRight size={14} strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ForumPager({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const prev = page > 1 ? hrefFor(page - 1) : null;
  const next = page < pageCount ? hrefFor(page + 1) : null;
  return (
    <div className="text-app-meta flex items-center justify-between gap-4 py-2 text-sm font-semibold tracking-[0.08em] uppercase">
      {prev ? (
        <Link href={prev} className="text-app-ink hover:underline">
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} of {pageCount}
      </span>
      {next ? (
        <Link href={next} className="text-app-ink hover:underline">
          Next
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
