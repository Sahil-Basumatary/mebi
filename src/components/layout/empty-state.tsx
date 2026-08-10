import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("border-app-divider bg-app-wash border p-5", className)}>
      <p className="text-app-label text-eyebrow font-semibold tracking-eyebrow uppercase">
        {eyebrow}
      </p>
      <h3 className="text-app-ink mt-2 font-serif text-2xl font-light">{title}</h3>
      {description ? (
        <p className="text-app-body mt-2 max-w-2xl text-body-sm leading-6">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
