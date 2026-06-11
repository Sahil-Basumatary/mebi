import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  selected?: boolean;
  children: ReactNode;
}

export function Panel({ title, selected = false, className, children, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "bg-surface shadow-soft rounded-lg border p-5 transition-colors",
        selected ? "border-border-strong" : "border-border",
        className,
      )}
      {...props}
    >
      {title ? (
        <p className="text-muted mb-2 text-xs font-semibold tracking-wider uppercase">{title}</p>
      ) : null}
      {children}
    </div>
  );
}
