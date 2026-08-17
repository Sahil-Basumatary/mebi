"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  getShortcutBindings,
  resetShortcutBindings,
  updateLastVisitedPath,
  updateShortcutBindings,
} from "@/components/settings/actions";
import { useSettingsModal } from "@/components/settings/settings-modal";
import {
  comboFromKeyboardEvent,
  DEFAULT_SHORTCUT_BINDINGS,
  eventMatchesCombo,
  findBindingConflicts,
  formatCombo,
  isSequenceCombo,
  mergeShortcutBindings,
  SHORTCUT_DEFINITIONS,
  type ShortcutBindingMap,
  type ShortcutId,
} from "@/lib/keyboard-shortcuts";
import { isAllowedAppPath } from "@/lib/startup";
import { cn } from "@/lib/utils";

type KeyboardShortcutsContextValue = {
  bindings: ShortcutBindingMap;
  openCustomize: () => void;
  openPalette: () => void;
  setBinding: (id: ShortcutId, combo: string) => Promise<string | null>;
  resetBindings: () => Promise<void>;
};

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsProvider");
  }
  return context;
}

const NAV_ITEMS = [
  { href: "/home", label: "Home", keywords: "home build dashboard" },
  { href: "/projects", label: "Projects", keywords: "projects build" },
  { href: "/partners", label: "Partners", keywords: "partners people" },
  { href: "/inbox", label: "Requests", keywords: "inbox requests" },
  { href: "/forum", label: "Forum", keywords: "forum threads partners lft chat" },
  { href: "/proof", label: "Proof", keywords: "proof community evidence" },
] as const;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function CommandPalette({
  open,
  onClose,
  onOpenSettings,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [
      ...NAV_ITEMS.map((item) => ({
        id: item.href,
        label: item.label,
        hint: item.href,
        run: () => router.push(item.href),
        haystack: `${item.label} ${item.keywords}`,
      })),
      {
        id: "settings",
        label: "Open settings",
        hint: "Preferences",
        run: onOpenSettings,
        haystack: "settings preferences account",
      },
    ];
    if (!q) return base;
    return base.filter((item) => item.haystack.includes(q));
  }, [query, router, onOpenSettings]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-start justify-center bg-black/35 px-4 pt-[12vh]">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="border-app-border bg-app-canvas relative z-[141] w-full max-w-xl overflow-hidden rounded-[12px] border shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              onClose();
            }
            if (event.key === "Enter" && results[0]) {
              event.preventDefault();
              results[0].run();
              onClose();
            }
          }}
          aria-label="Search pages and actions"
          placeholder="Search pages and actions…"
          className="border-app-border text-app-fg placeholder:text-app-muted-2 h-12 w-full border-b bg-transparent px-4 text-[15px] outline-none"
        />
        <ul className="max-h-72 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="text-app-muted px-3 py-6 text-center text-sm">No matches</li>
          ) : (
            results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  className="text-app-fg hover:bg-app-hover flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors"
                >
                  <span>{item.label}</span>
                  <span className="text-app-muted-2 text-xs">{item.hint}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

function ComboChips({ combo }: { combo: string }) {
  if (isSequenceCombo(combo)) {
    const [a, b] = combo.split("+");
    return (
      <span className="inline-flex items-center gap-1">
        <kbd className="border-app-border bg-app-surface text-app-fg rounded border px-1.5 py-0.5 font-mono text-[11px] leading-none">
          {a.toUpperCase()}
        </kbd>
        <span className="text-app-muted-2 text-[11px]">then</span>
        <kbd className="border-app-border bg-app-surface text-app-fg rounded border px-1.5 py-0.5 font-mono text-[11px] leading-none">
          {b.toUpperCase()}
        </kbd>
      </span>
    );
  }
  const isApple =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const parts = combo.split("+").map((part) => {
    if (part === "meta") return isApple ? "⌘" : "Ctrl";
    if (part === "ctrl") return isApple ? "⌃" : "Ctrl";
    if (part === "alt") return isApple ? "⌥" : "Alt";
    if (part === "shift") return isApple ? "⇧" : "Shift";
    if (part === "esc") return "Esc";
    if (part === "space") return "Space";
    return part.toUpperCase();
  });
  return (
    <span className="inline-flex items-center gap-1">
      {parts.map((part) => (
        <kbd
          key={`${combo}-${part}`}
          className="border-app-border bg-app-surface text-app-fg rounded border px-1.5 py-0.5 font-mono text-[11px] leading-none"
        >
          {part}
        </kbd>
      ))}
    </span>
  );
}

function CustomizeShortcutsModal({
  open,
  onClose,
  bindings,
  onChange,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  bindings: ShortcutBindingMap;
  onChange: (id: ShortcutId, combo: string) => Promise<string | null>;
  onReset: () => Promise<void>;
}) {
  const [listening, setListening] = useState<ShortcutId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sequencePrefix, setSequencePrefix] = useState<string | null>(null);
  const conflicts = findBindingConflicts(bindings);

  useEffect(() => {
    if (!open) {
      setListening(null);
      setError(null);
      setQuery("");
      setSequencePrefix(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !listening) return;
    function onKey(event: KeyboardEvent) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") {
        setListening(null);
        setSequencePrefix(null);
        return;
      }
      const hasMod = event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;
      const key = (event.key || "").toLowerCase();
      if (!hasMod && /^[a-z0-9]$/.test(key)) {
        if (!sequencePrefix) {
          setSequencePrefix(key);
          return;
        }
        const combo = `${sequencePrefix}+${key}`;
        setSequencePrefix(null);
        void onChange(listening!, combo).then((message) => {
          setError(message);
          if (!message) setListening(null);
        });
        return;
      }
      setSequencePrefix(null);
      const combo = comboFromKeyboardEvent(event);
      if (!combo) return;
      void onChange(listening!, combo).then((message) => {
        setError(message);
        if (!message) setListening(null);
      });
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, listening, onChange, sequencePrefix]);

  if (!open || typeof document === "undefined") return null;

  const groups = ["General", "Navigation", "Appearance"] as const;
  const q = query.trim().toLowerCase();

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 px-4">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="border-app-border bg-app-canvas relative z-[151] flex max-h-[min(720px,86vh)] w-full max-w-lg flex-col overflow-hidden rounded-[12px] border shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
      >
        <div className="border-app-border flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-app-fg text-lg font-semibold tracking-[-0.01em]">
              Keyboard shortcuts
            </h2>
            <p className="text-app-muted mt-1 text-[13px] leading-[18px]">
              Click a shortcut, then press the new keys. Letter pairs like G then H
              work as sequences. Esc cancels capture.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-app-muted hover:bg-app-hover hover:text-app-fg rounded-md px-2 py-1 text-sm transition-colors"
          >
            Close
          </button>
        </div>
        <div className="border-app-border border-b px-5 py-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Filter shortcuts"
            placeholder="Filter shortcuts…"
            className="bg-app-surface text-app-fg placeholder:text-app-muted-2 border-app-border h-8 w-full rounded-md border px-3 text-sm outline-none focus:border-[#2783de]"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {groups.map((group) => {
            const items = SHORTCUT_DEFINITIONS.filter(
              (item) =>
                item.group === group &&
                (!q ||
                  item.label.toLowerCase().includes(q) ||
                  item.id.toLowerCase().includes(q) ||
                  formatCombo(bindings[item.id]).toLowerCase().includes(q)),
            );
            if (items.length === 0) return null;
            return (
              <section key={group} className="mb-6 last:mb-0">
                <h3 className="text-app-muted mb-2 text-xs font-medium tracking-[0.04em] uppercase">
                  {group}
                </h3>
                <div className="space-y-1">
                  {items.map((item) => {
                    const conflict = conflicts[item.id];
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 rounded-md px-1 py-1.5"
                      >
                        <div className="min-w-0">
                          <p className="text-app-fg text-sm">{item.label}</p>
                          {conflict ? (
                            <p className="text-[12px] text-[#c4554a]">
                              Conflicts with{" "}
                              {SHORTCUT_DEFINITIONS.find((entry) => entry.id === conflict)?.label}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setSequencePrefix(null);
                            setListening(item.id);
                          }}
                          className={cn(
                            "border-app-border text-app-fg hover:bg-app-hover min-w-[6.5rem] rounded-md border px-2.5 py-1.5 transition-colors",
                            listening === item.id && "border-[#2783de] ring-2 ring-[#2783de]/20",
                            conflict && "border-[#c4554a]/50",
                          )}
                        >
                          {listening === item.id ? (
                            <span className="text-app-muted text-[12px]">
                              {sequencePrefix
                                ? `${sequencePrefix.toUpperCase()} then…`
                                : "Press keys…"}
                            </span>
                          ) : (
                            <ComboChips combo={bindings[item.id]} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {error ? <p className="text-[13px] text-[#c4554a]">{error}</p> : null}
        </div>
        <div className="border-app-border flex items-center justify-between border-t px-5 py-3">
          <button
            type="button"
            onClick={() => {
              void onReset();
              setError(null);
              setListening(null);
            }}
            className="text-app-muted hover:text-app-fg text-sm transition-colors"
          >
            Reset to defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-app-fg text-app-canvas hover:opacity-90 rounded-md px-3 py-1.5 text-sm font-medium transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PathTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || !isAllowedAppPath(pathname)) return;
    if (last.current === pathname) return;
    last.current = pathname;
    const timer = window.setTimeout(() => {
      void updateLastVisitedPath(pathname);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const settings = useSettingsModal();
  const [bindings, setBindings] = useState<ShortcutBindingMap>(DEFAULT_SHORTCUT_BINDINGS);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const sequenceRef = useRef<{ prefix: string; expires: number } | null>(null);

  useEffect(() => {
    void getShortcutBindings().then((value) => {
      setBindings(mergeShortcutBindings(value));
    });
  }, []);

  const openCustomize = useCallback(() => setCustomizeOpen(true), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openSettings = useCallback(() => settings.open("preferences"), [settings]);

  const runAction = useCallback(
    (id: ShortcutId) => {
      switch (id) {
        case "search":
          setPaletteOpen(true);
          return;
        case "openSettings":
          openSettings();
          return;
        case "openShortcuts":
          setCustomizeOpen(true);
          return;
        case "goHome":
          router.push("/home");
          return;
        case "goProjects":
          router.push("/projects");
          return;
        case "goPartners":
          router.push("/partners");
          return;
        case "goInbox":
          router.push("/inbox");
          return;
        case "goForum":
          router.push("/forum");
          return;
        case "goProof":
          router.push("/proof");
          return;
        case "toggleTheme":
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          return;
      }
    },
    [openSettings, router, resolvedTheme, setTheme],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (customizeOpen) return;
      if (paletteOpen) return;
      if (isEditableTarget(event.target) && !(event.metaKey || event.ctrlKey)) {
        return;
      }

      const now = Date.now();
      const pending = sequenceRef.current;
      if (pending && pending.expires > now) {
        const combo = `${pending.prefix}+${(event.key || "").toLowerCase()}`;
        const match = (Object.keys(bindings) as ShortcutId[]).find(
          (id) => bindings[id] === combo,
        );
        sequenceRef.current = null;
        if (match) {
          event.preventDefault();
          runAction(match);
          return;
        }
      } else {
        sequenceRef.current = null;
      }

      for (const id of Object.keys(bindings) as ShortcutId[]) {
        const combo = bindings[id];
        if (isSequenceCombo(combo)) {
          const [prefix] = combo.split("+");
          if (
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey &&
            event.key.toLowerCase() === prefix
          ) {
            sequenceRef.current = { prefix, expires: now + 900 };
            return;
          }
          continue;
        }
        if (eventMatchesCombo(event, combo)) {
          event.preventDefault();
          runAction(id);
          return;
        }
      }
    }

    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [bindings, customizeOpen, paletteOpen, runAction]);

  const setBinding = useCallback(async (id: ShortcutId, combo: string) => {
    const result = await updateShortcutBindings({ [id]: combo });
    setBindings(result.bindings);
    return result.error;
  }, []);

  const resetBindings = useCallback(async () => {
    const next = await resetShortcutBindings();
    setBindings(next);
  }, []);

  const value = useMemo(
    () => ({
      bindings,
      openCustomize,
      openPalette,
      setBinding,
      resetBindings,
    }),
    [bindings, openCustomize, openPalette, setBinding, resetBindings],
  );

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenSettings={() => {
          setPaletteOpen(false);
          openSettings();
        }}
      />
      <CustomizeShortcutsModal
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        bindings={bindings}
        onChange={setBinding}
        onReset={resetBindings}
      />
      <PathTracker />
    </KeyboardShortcutsContext.Provider>
  );
}
