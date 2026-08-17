import Link from "next/link";
import { cn } from "@/lib/utils";

type AppTab = {
  id: string;
  label: string;
  href: string;
  count?: number;
};

export function AppTabs({
  items,
  active,
  ariaLabel,
  className,
}: {
  items: readonly AppTab[];
  active: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <nav
      role="tablist"
      aria-label={ariaLabel}
      className={cn("border-app-divider bg-app-paper flex overflow-x-auto border", className)}
    >
      {items.map((item) => {
        const current = item.id === active;
        return (
          <Link
            key={item.id}
            href={item.href}
            role="tab"
            aria-selected={current}
            aria-current={current ? "page" : undefined}
            className={cn(
              "border-app-divider flex h-10 shrink-0 items-center gap-2 border-r px-4 text-sm font-medium transition-colors",
              current
                ? "bg-app-ink text-app-paper"
                : "text-app-label hover:bg-app-wash hover:text-app-ink",
            )}
          >
            {item.label}
            {item.count ? (
              <span
                className={cn(
                  "min-w-5 px-1.5 py-0.5 text-center text-[11px] leading-none font-semibold tabular-nums",
                  current ? "bg-app-paper text-app-ink" : "bg-app-chip text-app-label",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
