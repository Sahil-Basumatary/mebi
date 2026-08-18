import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  boxed?: boolean;
  density?: "display" | "compact";
};

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  actions,
  className,
  boxed = false,
  density = "display",
}: PageHeaderProps) {
  const compact = density === "compact";
  const copy = (
    <div className="min-w-0">
      <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">{eyebrow}</p>
      <h1
        className={cn(
          "text-app-ink font-medium",
          compact
            ? "mt-1 text-[1.75rem] leading-none sm:text-[2rem]"
            : "max-w-3xl text-4xl leading-none sm:text-5xl",
        )}
      >
        {title}
      </h1>
      {children}
      {description ? (
        <p
          className={cn(
            "text-app-body max-w-2xl text-sm",
            compact ? "mt-1 leading-5" : "mt-2 leading-6",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );

  return (
    <header
      className={cn(
        boxed
          ? compact
            ? "border-app-divider bg-app-paper border px-4 py-3"
            : "border-app-divider bg-app-paper border px-5 py-4"
          : compact
            ? undefined
            : "space-y-2",
        className,
      )}
    >
      {actions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {copy}
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        </div>
      ) : (
        copy
      )}
    </header>
  );
}
