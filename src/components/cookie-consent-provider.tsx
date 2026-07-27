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
import { createPortal } from "react-dom";
import {
  getCookieConsent,
  updateCookieConsent,
} from "@/components/settings/actions";
import {
  acceptAllConsent,
  canUseCategory,
  COOKIE_CATEGORIES,
  DEFAULT_COOKIE_CONSENT,
  hasDecidedConsent,
  normalizeCookieConsent,
  parseCookieConsentHeader,
  rejectOptionalConsent,
  writeConsentBrowserCookie,
  type CookieCategory,
  type CookieConsentState,
} from "@/lib/cookie-consent";
import { cn } from "@/lib/utils";

type CookieConsentContextValue = {
  consent: CookieConsentState;
  openCustomize: () => void;
  canUse: (category: Exclude<CookieCategory, "necessary">) => boolean;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return context;
}

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full transition-colors",
        checked ? "bg-app-fg" : "bg-app-border",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "bg-app-canvas absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}

function CookieCustomizeModal({
  open,
  draft,
  onClose,
  onChange,
  onSave,
}: {
  open: boolean;
  draft: CookieConsentState;
  onClose: () => void;
  onChange: (next: CookieConsentState) => void;
  onSave: () => void;
}) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-end justify-center bg-black/40 px-4 sm:items-center">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cookie settings"
        className="border-app-border bg-app-canvas relative z-[161] mb-4 flex max-h-[min(720px,86vh)] w-full max-w-lg flex-col overflow-hidden rounded-[12px] border shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:mb-0"
      >
        <div className="border-app-border border-b px-5 py-4">
          <h2 className="text-app-fg text-lg font-semibold tracking-[-0.01em]">
            Cookie settings
          </h2>
          <p className="text-app-muted mt-1 text-[13px] leading-[18px]">
            Choose which optional cookies mebi can use. Necessary cookies stay on.
          </p>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-5 py-4">
          {COOKIE_CATEGORIES.map((category) => {
            const checked =
              category.id === "necessary" ? true : draft[category.id];
            return (
              <div
                key={category.id}
                className="flex items-start justify-between gap-4 rounded-md px-1 py-3"
              >
                <div className="min-w-0">
                  <p className="text-app-fg text-sm font-medium">{category.label}</p>
                  <p className="text-app-muted mt-0.5 text-[13px] leading-[18px]">
                    {category.description}
                  </p>
                </div>
                <Toggle
                  label={category.label}
                  checked={checked}
                  disabled={category.locked}
                  onChange={(next) => {
                    if (category.id === "necessary") return;
                    onChange({ ...draft, [category.id]: next, necessary: true });
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="border-app-border flex items-center justify-end gap-2 border-t px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="text-app-muted hover:text-app-fg rounded-md px-3 py-1.5 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="bg-app-fg text-app-canvas hover:opacity-90 rounded-md px-3 py-1.5 text-sm font-medium transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentState>(DEFAULT_COOKIE_CONSENT);
  const [hydrated, setHydrated] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [draft, setDraft] = useState<CookieConsentState>(DEFAULT_COOKIE_CONSENT);

  useEffect(() => {
    const fromBrowser = parseCookieConsentHeader(document.cookie);
    setConsent(fromBrowser);
    setDraft(fromBrowser);
    setHydrated(true);
    void getCookieConsent().then((fromDb) => {
      if (hasDecidedConsent(fromDb)) {
        setConsent(fromDb);
        setDraft(fromDb);
        writeConsentBrowserCookie(fromDb);
        return;
      }
      if (hasDecidedConsent(fromBrowser)) {
        void updateCookieConsent({
          preferences: fromBrowser.preferences,
          analytics: fromBrowser.analytics,
          marketing: fromBrowser.marketing,
        }).then((synced) => {
          setConsent(synced);
          setDraft(synced);
          writeConsentBrowserCookie(synced);
        });
      }
    });
  }, []);

  const persist = useCallback(async (next: CookieConsentState) => {
    const saved = await updateCookieConsent({
      preferences: next.preferences,
      analytics: next.analytics,
      marketing: next.marketing,
    });
    setConsent(saved);
    setDraft(saved);
    writeConsentBrowserCookie(saved);
    setCustomizeOpen(false);
  }, []);

  const openCustomize = useCallback(() => {
    setDraft(consent);
    setCustomizeOpen(true);
  }, [consent]);

  const value = useMemo(
    () => ({
      consent,
      openCustomize,
      canUse: (category: Exclude<CookieCategory, "necessary">) =>
        canUseCategory(consent, category),
    }),
    [consent, openCustomize],
  );

  const showBanner = hydrated && !hasDecidedConsent(consent);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {showBanner ? (
        <div className="border-app-border bg-app-canvas fixed inset-x-0 bottom-0 z-[140] border-t p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] sm:p-5">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-2xl">
              <p className="text-app-fg text-sm font-medium">We use cookies</p>
              <p className="text-app-muted mt-1 text-[13px] leading-[18px]">
                Necessary cookies keep mebi signed in and secure. Optional cookies
                help with preferences, analytics, and marketing — you choose.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCustomize}
                className="border-app-border text-app-fg hover:bg-app-hover rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={() => void persist(rejectOptionalConsent())}
                className="border-app-border text-app-fg hover:bg-app-hover rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Reject optional
              </button>
              <button
                type="button"
                onClick={() => void persist(acceptAllConsent())}
                className="bg-app-fg text-app-canvas hover:opacity-90 rounded-md px-3 py-1.5 text-sm font-medium transition-opacity"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <CookieCustomizeModal
        open={customizeOpen}
        draft={draft}
        onClose={() => setCustomizeOpen(false)}
        onChange={setDraft}
        onSave={() =>
          void persist(
            normalizeCookieConsent({
              ...draft,
              decidedAt: new Date().toISOString(),
            }),
          )
        }
      />
    </CookieConsentContext.Provider>
  );
}
