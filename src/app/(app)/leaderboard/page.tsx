import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout";
import { STANDING_BOARDS, type StandingBoardId } from "@/lib/badges";
import { requireOnboardedUser } from "@/lib/current-user";
import { getStandingBoard, type StandingRow } from "@/lib/standings";
import { displayName, initials } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import { BoardMetricSelect } from "./board-nav";

type LeaderboardPageProps = {
  searchParams: Promise<{ board?: string }>;
};

function isBoard(value: string | undefined): value is StandingBoardId {
  return STANDING_BOARDS.some((board) => board.id === value);
}

function StandingEntry({
  row,
  metric,
  isYou,
  alt,
}: {
  row: StandingRow;
  metric: string;
  isYou: boolean;
  alt?: boolean;
}) {
  const name = displayName(row.fullName, row.username);
  const mark = initials(row.fullName, row.username);
  const href = row.username ? `/u/${row.username}` : null;
  const rowClass = cn(
    "grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem] items-center gap-3 px-4 py-3 transition-colors sm:grid-cols-[3rem_minmax(0,1fr)_6.5rem] sm:gap-4",
    isYou ? "bg-app-chip" : alt ? "bg-app-wash/70" : "bg-app-paper",
    href && "hover:bg-app-hover",
  );

  const body = (
    <>
      <span
        className={cn(
          "text-right text-base font-semibold tabular-nums",
          row.rank <= 3 || isYou ? "text-app-ink" : "text-app-meta",
        )}
      >
        {row.rank}
      </span>

      <div className="flex min-w-0 items-center gap-3">
        {row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.imageUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="bg-app-wash text-app-label flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[10px] tracking-meta">
            {mark}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-app-ink truncate text-[15px] font-semibold">{name}</span>
            {row.username ? (
              <span className="bg-app-chip text-app-meta rounded px-1.5 py-0.5 font-mono text-[11px] tracking-meta">
                #{row.username}
              </span>
            ) : null}
            {isYou ? (
              <span className="text-app-meta font-mono text-[11px] tracking-meta uppercase">
                You
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="text-right">
        <p className="text-app-ink text-base font-semibold tabular-nums">
          {row.value.toLocaleString("en-GB")}
        </p>
        <p className="text-app-meta mt-0.5 text-xs sm:hidden">{metric}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {body}
      </Link>
    );
  }

  return <div className={rowClass}>{body}</div>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const viewer = await requireOnboardedUser();
  const params = await searchParams;
  const boardId = isBoard(params.board) ? params.board : "verified-ships";
  const board = STANDING_BOARDS.find((item) => item.id === boardId)!;
  const { rows, viewer: viewerStanding } = await getStandingBoard(boardId, viewer.id);
  const shown = rows.length;
  const viewerInList = rows.some((row) => row.userId === viewer.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Rankings" title="Leaderboard" />

      <section className="border-app-divider bg-app-paper overflow-hidden border">
        <div className="border-app-divider flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-3">
          <h2 className="text-app-ink text-base font-semibold">{board.title}</h2>
          <p className="text-app-meta font-mono text-[11px] tracking-meta uppercase">
            {shown} builder{shown === 1 ? "" : "s"}
          </p>
          <p className="text-app-body w-full text-sm">{board.description}</p>
        </div>

        <div className="text-app-meta border-app-divider grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem] items-center gap-3 border-b px-4 py-2 font-mono text-[11px] tracking-meta uppercase sm:grid-cols-[3rem_minmax(0,1fr)_6.5rem] sm:gap-4">
          <span className="text-right">#</span>
          <span>Builder</span>
          <Suspense
            fallback={
              <span className="text-right">{board.metric}</span>
            }
          >
            <BoardMetricSelect />
          </Suspense>
        </div>

        {rows.length ? (
          <ol>
            {rows.map((row, index) => (
              <li key={row.userId} className="border-app-divider/80 border-t first:border-t-0">
                <StandingEntry
                  row={row}
                  metric={board.metric}
                  isYou={row.userId === viewer.id}
                  alt={index % 2 === 1}
                />
              </li>
            ))}
          </ol>
        ) : (
          <div className="px-4 py-16 text-center">
            <p className="text-app-ink text-base font-medium">No students yet.</p>
            <p className="text-app-meta mt-1 text-sm">
              Rankings show once builders publish proof.
            </p>
          </div>
        )}

        {viewerStanding && !viewerInList ? (
          <div className="border-app-divider border-t">
            <StandingEntry row={viewerStanding} metric={board.metric} isYou />
          </div>
        ) : null}
      </section>

      <p className="text-app-meta text-sm">
        Rankings use published proof and peer signatures.
      </p>
    </div>
  );
}
