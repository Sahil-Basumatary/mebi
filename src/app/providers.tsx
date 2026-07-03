"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

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
      {children}
    </ThemeProvider>
  );
}
