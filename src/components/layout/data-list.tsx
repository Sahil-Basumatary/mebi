import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataList({
  children,
  ariaLabel,
  className,
  toolbar,
  columns,
  empty,
}: {
  children?: ReactNode;
  ariaLabel: string;
  className?: string;
  toolbar?: ReactNode;
  columns?: ReactNode;
  empty?: ReactNode;
}) {
  return (
    <div className={cn("border-app-divider bg-app-paper border", className)}>
      {toolbar}
      {columns}
      {children ? (
        <div role="list" aria-label={ariaLabel} className="divide-app-divider divide-y">
          {children}
        </div>
      ) : (
        empty
      )}
    </div>
  );
}

export function ListColumns({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-app-meta border-app-divider hidden items-center gap-4 border-b px-4 py-2 font-mono text-[11px] tracking-[0.08em] uppercase lg:grid",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-app-divider flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className={cn("text-app-ink text-sm font-semibold", eyebrow && "mt-1")}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function DataRow({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article
      role="listitem"
      className={cn("bg-app-paper hover:bg-app-wash px-4 py-2.5 transition-colors", className)}
      {...props}
    >
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
