"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { CookieConsentProvider } from "@/components/cookie-consent-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { ReverificationProvider } from "@/components/settings/reverification";

export function Providers({
  children,
  defaultTheme = "light",
  spellcheckerLanguage = "en-GB",
  timezone = "auto",
}: {
  children: ReactNode;
  defaultTheme?: string;
  spellcheckerLanguage?: string;
  timezone?: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
    >
      <LocaleProvider initialLanguage={spellcheckerLanguage} initialTimezone={timezone}>
        <CookieConsentProvider>
          <ReverificationProvider>{children}</ReverificationProvider>
        </CookieConsentProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
