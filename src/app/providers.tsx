"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { ReverificationProvider } from "@/components/settings/reverification";

export function Providers({
  children,
  defaultTheme = "light",
}: {
  children: ReactNode;
  defaultTheme?: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
    >
      <ReverificationProvider>{children}</ReverificationProvider>
    </ThemeProvider>
  );
}
