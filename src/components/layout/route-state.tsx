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
          ? "border border-[#262626] bg-[#0a0a0a] p-8 text-[#ffffff]"
          : "border-app-divider bg-app-wash border p-8",
        className,
      )}
    >
      <p
        className={cn(
          "text-eyebrow font-semibold tracking-eyebrow uppercase",
          marketing ? "text-[#8f8f8f]" : "text-app-label",
        )}
      >
        {eyebrow}
      </p>
      <h1
        className={cn(
          "mt-3 font-serif text-3xl font-light sm:text-4xl",
          marketing ? "text-[#ffffff]" : "text-app-ink",
        )}
      >
        {title}
      </h1>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-2xl text-body-sm leading-6",
            marketing ? "text-[#b3b3b3]" : "text-app-body",
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap items-center gap-3">{action}</div> : null}
    </div>
  );
}
