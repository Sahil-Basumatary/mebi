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
          "border-app-divider bg-app-divider grid gap-px xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.45fr)]",
          className,
        )}
      >
        <div className="bg-app-paper flex flex-col justify-between p-5 sm:p-6">
          <div>
            <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
              {eyebrow}
            </p>
            <h1 className="text-app-ink mt-2 max-w-3xl font-serif text-4xl leading-none font-light tracking-[-0.035em] sm:text-5xl">
              {title}
            </h1>
          </div>
          {children}
          {description ? (
            <p className="text-app-body mt-4 max-w-2xl text-base leading-6">{description}</p>
          ) : null}
        </div>
        <div className="bg-app-chip flex flex-col justify-between p-5 sm:p-6">{aside}</div>
      </header>
    );
  }

  return (
    <header className={cn("space-y-2", className)}>
      <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">{eyebrow}</p>
      <h1 className="text-app-ink max-w-3xl font-serif text-4xl leading-none font-light tracking-[-0.035em] sm:text-5xl">
        {title}
      </h1>
      {children}
      {description ? (
        <p className="text-app-body max-w-2xl text-base leading-6">{description}</p>
      ) : null}
    </header>
  );
}
