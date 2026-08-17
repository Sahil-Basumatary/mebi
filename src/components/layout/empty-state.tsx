import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  fill?: boolean;
};

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
  className,
  fill = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-app-divider bg-app-wash border p-5",
        fill && "flex min-h-72 flex-1 flex-col justify-center sm:min-h-80",
        className,
      )}
    >
      <p className="text-app-label text-eyebrow tracking-eyebrow font-semibold uppercase">
        {eyebrow}
      </p>
      <h3 className="text-app-ink mt-2 font-serif text-2xl font-light">{title}</h3>
      {description ? (
        <p className="text-app-body text-body-sm mt-2 max-w-2xl leading-6">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
