"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PrefRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="text-app-fg text-sm font-medium">{label}</p>
        <p className="text-app-muted text-[13px] leading-[18px]">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function PrefToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full transition-colors",
        checked ? "bg-app-fg" : "bg-app-border",
      )}
    >
      <span
        className={cn(
          "bg-app-canvas absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}

export function PrefSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-app-fg border-app-border mb-4 border-b pb-3 text-base font-medium">
        {title}
      </h3>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
