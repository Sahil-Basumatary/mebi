import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  variant?: "panel" | "inline";
};

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
  className,
  variant = "panel",
}: EmptyStateProps) {
  const inline = variant === "inline";
  return (
    <div
      className={cn(
        inline ? "bg-app-paper px-4 py-12" : "border-app-divider bg-app-wash border px-4 py-8",
        className,
      )}
    >
      <p className="text-app-label text-eyebrow tracking-eyebrow font-semibold uppercase">
        {eyebrow}
      </p>
      <h3 className="text-app-ink mt-1.5 text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="text-app-body mt-1.5 max-w-xl text-sm leading-5">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}
