import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipProps = {
  children: ReactNode;
  tone?: "wash" | "paper" | "ink";
  className?: string;
};

export function Chip({ children, tone = "wash", className }: ChipProps) {
  return (
    <span
      className={cn(
        "border-app-divider inline-flex items-center border px-2 py-1 text-chip font-semibold tracking-chip uppercase",
        tone === "wash" && "bg-app-chip text-app-label",
        tone === "paper" && "bg-app-paper text-app-label",
        tone === "ink" && "bg-app-ink text-app-paper border-app-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
