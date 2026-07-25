"use client";

import type { ThemePreference } from "@prisma/client";
import { Check, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useState, useTransition } from "react";
import { AnchoredMenu } from "@/components/ui/anchored-menu";
import { updateThemePreference } from "./actions";

const OPTIONS = [
  { pref: "SYSTEM", theme: "system", label: "Use system setting" },
  { pref: "LIGHT", theme: "light", label: "Light" },
  { pref: "DARK", theme: "dark", label: "Dark" },
] as const;

const MENU_WIDTH = 250;

export function ThemeControl({ initial }: { initial: ThemePreference }) {
  const { setTheme } = useTheme();
  const [selected, setSelected] = useState<ThemePreference>(initial);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const current = OPTIONS.find((option) => option.pref === selected) ?? OPTIONS[0];

  function choose(option: (typeof OPTIONS)[number]) {
    setSelected(option.pref);
    setOpen(false);
    setTheme(option.theme);
    startTransition(() => updateThemePreference(option.pref));
  }

  return (
    <section>
      <h3 className="text-app-fg border-app-border mb-4 border-b pb-3 text-base font-medium">
        Appearance
      </h3>
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="text-app-fg text-sm font-medium">Theme</p>
          <p className="text-app-muted text-[13px] leading-[18px]">
            Choose a theme for mebi on this device
          </p>
        </div>
        <div className="relative shrink-0">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="border-app-border text-app-fg hover:bg-app-hover flex h-7 items-center gap-1 rounded-md border px-2 text-sm font-medium transition-colors"
          >
            {current.label}
            <ChevronDown size={14} strokeWidth={1.75} className="text-app-muted-2" />
          </button>
          <AnchoredMenu
            open={open}
            onClose={() => setOpen(false)}
            anchorRef={buttonRef}
            width={MENU_WIDTH}
            preferredMaxHeight={160}
            align="end"
          >
            {OPTIONS.map((option) => (
              <button
                key={option.pref}
                type="button"
                role="menuitem"
                onClick={() => choose(option)}
                className="text-app-fg hover:bg-app-hover flex h-7 w-full items-center justify-between rounded-md px-2 text-sm transition-colors"
              >
                {option.label}
                {option.pref === selected ? <Check size={14} strokeWidth={2} /> : null}
              </button>
            ))}
          </AnchoredMenu>
        </div>
      </div>
    </section>
  );
}
