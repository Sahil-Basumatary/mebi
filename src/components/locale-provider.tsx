"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { detectDeviceTimezone, resolveTimezone } from "@/lib/locale";

type LocaleContextValue = {
  spellcheckerLanguage: string;
  timezone: string;
  resolvedTimezone: string;
  setSpellcheckerLanguage: (code: string) => void;
  setTimezone: (timezone: string) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocalePrefs() {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocalePrefs must be used within LocaleProvider");
  }
  return value;
}

export function LocaleProvider({
  children,
  initialLanguage = "en-GB",
  initialTimezone = "auto",
}: {
  children: ReactNode;
  initialLanguage?: string;
  initialTimezone?: string;
}) {
  const [spellcheckerLanguage, setSpellcheckerLanguageState] = useState(initialLanguage);
  const [timezone, setTimezoneState] = useState(initialTimezone);
  const [deviceZone, setDeviceZone] = useState("UTC");

  useEffect(() => {
    setDeviceZone(detectDeviceTimezone());
  }, []);

  useEffect(() => {
    document.documentElement.lang = spellcheckerLanguage;
  }, [spellcheckerLanguage]);

  const setSpellcheckerLanguage = useCallback((code: string) => {
    setSpellcheckerLanguageState(code);
  }, []);

  const setTimezone = useCallback((next: string) => {
    setTimezoneState(next);
  }, []);

  const resolvedTimezone = useMemo(
    () => (timezone === "auto" ? deviceZone : resolveTimezone(timezone)),
    [timezone, deviceZone],
  );

  const value = useMemo(
    () => ({
      spellcheckerLanguage,
      timezone,
      resolvedTimezone,
      setSpellcheckerLanguage,
      setTimezone,
    }),
    [spellcheckerLanguage, timezone, resolvedTimezone, setSpellcheckerLanguage, setTimezone],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
