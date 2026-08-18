import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type RouteStateProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: "product" | "marketing";
};

export function RouteState({
  eyebrow,
  title,
  description,
  action,
  className,
  tone = "product",
}: RouteStateProps) {
  const marketing = tone === "marketing";
  return (
    <div
      className={cn(
        marketing
          ? "border border-[#262626] bg-[#0a0a0a] px-4 py-8 text-[#ffffff]"
          : "border-app-divider bg-app-paper border px-4 py-8",
        className,
      )}
    >
      <p
        className={cn(
          "text-eyebrow tracking-eyebrow font-semibold uppercase",
          marketing ? "text-[#8f8f8f]" : "text-app-label",
        )}
      >
        {eyebrow}
      </p>
      <h1
        className={cn(
          "mt-1.5 text-lg font-semibold",
          marketing ? "text-[#ffffff]" : "text-app-ink",
        )}
      >
        {title}
      </h1>
      {description ? (
        <p
          className={cn(
            "mt-1.5 max-w-xl text-sm leading-5",
            marketing ? "text-[#b3b3b3]" : "text-app-body",
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}
