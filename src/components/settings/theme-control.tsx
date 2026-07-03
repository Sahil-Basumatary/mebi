"use client";

import type { ThemePreference } from "@prisma/client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { updateThemePreference } from "./actions";

const OPTIONS = [
  { pref: "LIGHT", theme: "light", label: "Light", icon: Sun },
  { pref: "DARK", theme: "dark", label: "Dark", icon: Moon },
  { pref: "SYSTEM", theme: "system", label: "Match system", icon: Monitor },
] as const;

export function ThemeControl({ initial }: { initial: ThemePreference }) {
  const { setTheme } = useTheme();
  const [selected, setSelected] = useState<ThemePreference>(initial);
  const [, startTransition] = useTransition();

  function choose(option: (typeof OPTIONS)[number]) {
    setSelected(option.pref);
    setTheme(option.theme);
    startTransition(() => updateThemePreference(option.pref));
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-app-fg text-sm font-medium">Appearance</p>
        <p className="text-app-muted text-sm">
          Applies to this account and syncs across your devices.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = selected === option.pref;
          return (
            <button
              key={option.pref}
              type="button"
              onClick={() => choose(option)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-2.5 rounded-md border px-4 py-3 text-sm transition-colors",
                active
                  ? "border-app-accent text-app-fg font-medium"
                  : "border-app-border text-app-muted hover:border-app-border-strong hover:text-app-fg",
              )}
            >
              <Icon size={16} strokeWidth={1.75} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
