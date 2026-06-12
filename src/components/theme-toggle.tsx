"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { IconButton } from "./ui/icon-button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <IconButton
      label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon size={18} strokeWidth={1.75} className="block dark:hidden" />
      <Sun size={18} strokeWidth={1.75} className="hidden dark:block" />
    </IconButton>
  );
}
