"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useLocalePrefs } from "@/components/locale-provider";
import { useCookieConsent } from "@/components/cookie-consent-provider";
import { useKeyboardShortcuts } from "@/components/keyboard-shortcuts-provider";
import { AnchoredMenu } from "@/components/ui/anchored-menu";
import {
  detectDeviceTimezone,
  languageLabel,
  listTimezones,
  SPELLCHECKER_LANGUAGES,
} from "@/lib/locale";
import {
  startupLabel,
  type StartupPreferenceValue,
} from "@/lib/startup";
import {
  updateProfileDiscoverability,
  updateSpellcheckerLanguage,
  updateStartupPreference,
  updateTimezone,
} from "./actions";
import { PrefRow, PrefToggle } from "./pref-ui";
import { ThemeControl } from "./theme-control";
import type { ThemePreference } from "@prisma/client";

function Dropdown({
  label,
  open,
  onClose,
  onToggle,
  children,
  width = 280,
  preferredMaxHeight = 320,
}: {
  label: string;
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
  children: ReactNode;
  width?: number;
  preferredMaxHeight?: number;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="border-app-border text-app-fg hover:bg-app-hover flex h-7 max-w-[220px] items-center gap-1 rounded-md border px-2 text-sm font-medium transition-colors"
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={14} strokeWidth={1.75} className="text-app-muted-2 shrink-0" />
      </button>
      <AnchoredMenu
        open={open}
        onClose={onClose}
        anchorRef={buttonRef}
        width={width}
        preferredMaxHeight={preferredMaxHeight}
        align="end"
      >
        {children}
      </AnchoredMenu>
    </div>
  );
}

function MenuItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="text-app-fg hover:bg-app-hover flex h-7 w-full items-center justify-between gap-3 rounded-md px-2 text-left text-sm transition-colors"
    >
      <span className="truncate">{children}</span>
      {active ? <Check size={14} strokeWidth={2} className="shrink-0" /> : null}
    </button>
  );
}

export function PreferencesPanel({
  theme,
  spellcheckerLanguage,
  timezone,
  startupPreference,
  profilePrivate,
  onDiscoverabilitySaved,
}: {
  theme: ThemePreference;
  spellcheckerLanguage: string;
  timezone: string;
  startupPreference: StartupPreferenceValue;
  profilePrivate: boolean;
  onDiscoverabilitySaved?: () => void;
}) {
  const locale = useLocalePrefs();
  const shortcuts = useKeyboardShortcuts();
  const cookies = useCookieConsent();
  const [, startTransition] = useTransition();
  const [langOpen, setLangOpen] = useState(false);
  const [tzOpen, setTzOpen] = useState(false);
  const [startupOpen, setStartupOpen] = useState(false);
  const [tzQuery, setTzQuery] = useState("");
  const [deviceZone, setDeviceZone] = useState("UTC");
  const [startup, setStartup] = useState<StartupPreferenceValue>(startupPreference);
  const [discoverable, setDiscoverable] = useState(!profilePrivate);

  useEffect(() => {
    setDeviceZone(detectDeviceTimezone());
    locale.setSpellcheckerLanguage(spellcheckerLanguage);
    locale.setTimezone(timezone);
    setStartup(startupPreference);
    setDiscoverable(!profilePrivate);
    // Seed once from server payload when the panel mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spellcheckerLanguage, timezone, startupPreference, profilePrivate]);

  const zones = useMemo(() => listTimezones(), []);
  const filteredZones = useMemo(() => {
    const q = tzQuery.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter((zone) => zone.toLowerCase().includes(q));
  }, [zones, tzQuery]);

  const language = locale.spellcheckerLanguage;
  const storedTimezone = locale.timezone;
  const timezoneLabel =
    storedTimezone === "auto" ? `Auto (${deviceZone})` : storedTimezone.replace(/_/g, " ");

  function chooseLanguage(code: string) {
    locale.setSpellcheckerLanguage(code);
    setLangOpen(false);
    startTransition(() => updateSpellcheckerLanguage(code));
  }

  function chooseTimezone(next: string) {
    locale.setTimezone(next);
    setTzOpen(false);
    setTzQuery("");
    startTransition(() => updateTimezone(next));
  }

  function chooseStartup(next: StartupPreferenceValue) {
    setStartup(next);
    setStartupOpen(false);
    startTransition(() => updateStartupPreference(next));
  }

  function chooseDiscoverability(next: boolean) {
    const previous = discoverable;
    setDiscoverable(next);
    startTransition(async () => {
      const result = await updateProfileDiscoverability(next);
      if (result.error) {
        setDiscoverable(previous);
        return;
      }
      onDiscoverabilitySaved?.();
    });
  }

  return (
    <div className="space-y-10">
      <ThemeControl initial={theme} />

      <section>
        <h3 className="text-app-fg border-app-border mb-4 border-b pb-3 text-base font-medium">
          Privacy
        </h3>
        <div className="space-y-5">
          <PrefRow
            label="Show up in partner discovery"
            hint="When off, you won't appear in Partners or teammate suggestions. Existing inbox threads stay visible to people you've already contacted."
          >
            <PrefToggle
              checked={discoverable}
              onChange={chooseDiscoverability}
              label="Show up in partner discovery"
            />
          </PrefRow>
        </div>
      </section>

      <section>
        <h3 className="text-app-fg border-app-border mb-4 border-b pb-3 text-base font-medium">
          Language & region
        </h3>
        <div className="space-y-5">
          <PrefRow
            label="Spellchecker language"
            hint="Used by the browser for spelling suggestions in text fields."
          >
            <Dropdown
              label={languageLabel(language)}
              open={langOpen}
              onClose={() => setLangOpen(false)}
              onToggle={() => {
                setTzOpen(false);
                setStartupOpen(false);
                setLangOpen((value) => !value);
              }}
              width={280}
            >
              {SPELLCHECKER_LANGUAGES.map((option) => (
                <MenuItem
                  key={option.code}
                  active={option.code === language}
                  onClick={() => chooseLanguage(option.code)}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Dropdown>
          </PrefRow>

          <PrefRow
            label="Time zone"
            hint="Auto follows this device. Override only if you need a fixed zone."
          >
            <Dropdown
              label={timezoneLabel}
              open={tzOpen}
              onClose={() => {
                setTzOpen(false);
                setTzQuery("");
              }}
              onToggle={() => {
                setLangOpen(false);
                setStartupOpen(false);
                setTzOpen((value) => !value);
              }}
              width={320}
              preferredMaxHeight={360}
            >
              <div className="border-app-border bg-app-canvas sticky top-0 z-10 mb-1 border-b p-1">
                <input
                  value={tzQuery}
                  onChange={(event) => setTzQuery(event.target.value)}
                  placeholder="Search cities…"
                  className="bg-app-surface text-app-fg placeholder:text-app-muted-2 h-7 w-full rounded-md border border-transparent px-2 text-sm outline-none focus:border-[#2783de]"
                />
              </div>
              <MenuItem active={storedTimezone === "auto"} onClick={() => chooseTimezone("auto")}>
                Auto ({deviceZone})
              </MenuItem>
              {filteredZones.map((zone) => (
                <MenuItem
                  key={zone}
                  active={storedTimezone === zone}
                  onClick={() => chooseTimezone(zone)}
                >
                  {zone.replace(/_/g, " ")}
                </MenuItem>
              ))}
            </Dropdown>
          </PrefRow>
        </div>
      </section>

      <section>
        <h3 className="text-app-fg border-app-border mb-4 border-b pb-3 text-base font-medium">
          Desktop app
        </h3>
        <div className="space-y-5">
          <PrefRow
            label="Open on start"
            hint="Choose Home or continue from the last page you visited."
          >
            <Dropdown
              label={startupLabel(startup)}
              open={startupOpen}
              onClose={() => setStartupOpen(false)}
              onToggle={() => {
                setLangOpen(false);
                setTzOpen(false);
                setStartupOpen((value) => !value);
              }}
              width={220}
            >
              <MenuItem active={startup === "HOME"} onClick={() => chooseStartup("HOME")}>
                Home
              </MenuItem>
              <MenuItem
                active={startup === "LAST_VISITED"}
                onClick={() => chooseStartup("LAST_VISITED")}
              >
                Last visited page
              </MenuItem>
            </Dropdown>
          </PrefRow>

          <PrefRow
            label="Keyboard shortcuts"
            hint="Remap search, navigation, settings, and theme shortcuts."
          >
            <button
              type="button"
              onClick={shortcuts.openCustomize}
              className="border-app-border text-app-fg hover:bg-app-hover flex h-7 items-center rounded-md border px-2.5 text-sm font-medium transition-colors"
            >
              Customize
            </button>
          </PrefRow>

          <PrefRow
            label="Cookie settings"
            hint="Control necessary, preferences, analytics, and marketing cookies."
          >
            <button
              type="button"
              onClick={cookies.openCustomize}
              className="border-app-border text-app-fg hover:bg-app-hover flex h-7 items-center rounded-md border px-2.5 text-sm font-medium transition-colors"
            >
              Customize
            </button>
          </PrefRow>
        </div>
      </section>
    </div>
  );
}
