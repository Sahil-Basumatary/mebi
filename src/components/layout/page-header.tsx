import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
  children,
  className,
}: PageHeaderProps) {
  if (aside) {
    return (
      <header
        className={cn(
          "border-app-divider bg-app-divider grid gap-px xl:grid-cols-[1.2fr_0.8fr]",
          className,
        )}
      >
        <div className="bg-app-paper flex flex-col justify-between p-8 lg:p-10">
          <div>
            <p className="text-app-label text-eyebrow font-semibold tracking-eyebrow uppercase">
              {eyebrow}
            </p>
            <h1 className="text-app-ink mt-5 max-w-3xl font-serif text-display leading-[0.98] font-light tracking-display">
              {title}
            </h1>
          </div>
          {children}
          {description ? (
            <p className="text-app-body mt-6 max-w-2xl text-body-sm leading-7">{description}</p>
          ) : null}
        </div>
        <div className="bg-app-chip flex flex-col justify-between p-8 lg:p-10">{aside}</div>
      </header>
    );
  }

  return (
    <header className={cn("space-y-3", className)}>
      <p className="text-app-label text-eyebrow font-semibold tracking-eyebrow uppercase">{eyebrow}</p>
      <h1 className="text-app-ink max-w-3xl font-serif text-display leading-[0.98] font-light tracking-display">
        {title}
      </h1>
      {children}
      {description ? (
        <p className="text-app-body max-w-2xl text-body leading-7">{description}</p>
      ) : null}
    </header>
  );
}
