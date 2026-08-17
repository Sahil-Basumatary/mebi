import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Section({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  id,
}: SectionProps) {
  const hasHeader = Boolean(eyebrow || title || description || action);

  return (
    <section id={id} className={cn("flex flex-col gap-4", className)}>
      {hasHeader ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-app-ink font-serif text-2xl font-light">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-app-body text-body-sm max-w-2xl leading-6">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
