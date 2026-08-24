"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { CookieConsentProvider } from "@/components/cookie-consent-provider";
import { ConsentedTelemetry } from "@/components/consented-telemetry";
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
      storageKey="hackollab-theme"
    >
      <LocaleProvider initialLanguage={spellcheckerLanguage} initialTimezone={timezone}>
        <CookieConsentProvider>
          <ConsentedTelemetry />
          <ReverificationProvider>{children}</ReverificationProvider>
        </CookieConsentProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
