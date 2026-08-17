import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataList({
  children,
  ariaLabel,
  className,
}: {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="list"
      aria-label={ariaLabel}
      className={cn(
        "border-app-divider bg-app-paper divide-app-divider divide-y border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataRow({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article role="listitem" className={cn("bg-app-paper px-4 py-3", className)} {...props}>
      {children}
    </article>
  );
}

export function MetaLine({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("text-app-meta flex flex-wrap items-center gap-x-2 gap-y-1 text-xs", className)}
    >
      {children}
    </div>
  );
}
