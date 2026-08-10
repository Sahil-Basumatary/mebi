"use client";

import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { AnchoredMenu } from "@/components/ui/anchored-menu";
import { STANDING_BOARDS, type StandingBoardId } from "@/lib/badges";
import { cn } from "@/lib/utils";

const DEFAULT_BOARD: StandingBoardId = "verified-ships";

function currentBoard(value: string | null): StandingBoardId {
  return STANDING_BOARDS.some((board) => board.id === value)
    ? (value as StandingBoardId)
    : DEFAULT_BOARD;
}

export function BoardMetricSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardId = currentBoard(searchParams.get("board"));
  const board = STANDING_BOARDS.find((item) => item.id === boardId)!;
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function choose(id: StandingBoardId) {
    setOpen(false);
    if (id === boardId) return;
    router.replace(`/leaderboard?board=${id}`, { scroll: false });
  }

  return (
    <div className="relative flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change leaderboard metric"
        className="text-app-meta hover:text-app-ink inline-flex items-center gap-1 font-mono text-[11px] tracking-meta uppercase transition-colors"
      >
        {board.metric}
        <ChevronDown size={12} strokeWidth={2} className="shrink-0" />
      </button>
      <AnchoredMenu
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
        width={220}
        preferredMaxHeight={320}
        align="end"
      >
        <div role="menu" className="border-app-divider bg-app-paper border py-1 shadow-lg">
          {STANDING_BOARDS.map((item) => {
            const active = item.id === boardId;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(item.id)}
                className={cn(
                  "flex w-full flex-col items-start px-3 py-2 text-left transition-colors",
                  active ? "bg-app-chip" : "hover:bg-app-wash",
                )}
              >
                <span
                  className={cn(
                    "text-sm",
                    active ? "text-app-ink font-medium" : "text-app-label",
                  )}
                >
                  {item.title}
                </span>
                <span className="text-app-meta mt-0.5 text-xs">{item.metric}</span>
              </button>
            );
          })}
        </div>
      </AnchoredMenu>
    </div>
  );
}
