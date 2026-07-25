"use client";

import { useUser } from "@clerk/nextjs";
import { Check, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getSettingsData, type SettingsData } from "./actions";
import { EmailsPane } from "./email-manager";
import { ProfileForm } from "./profile-form";
import { SecurityPanel } from "./security-panel";
import { ThemeControl } from "./theme-control";

type SectionId = "profile" | "preferences" | "security";
type SubviewId = "emails";

const SECTIONS = [
  {
    id: "profile",
    title: "Profile",
    description: "Manage your profile, links, and how you show up to teammates.",
  },
  {
    id: "preferences",
    title: "Preferences",
    description: "Choose how you want mebi to look and behave",
  },
  {
    id: "security",
    title: "Security",
    description: "Manage your login, password, and account protection.",
  },
] as const;

const SECONDARY_SECTIONS = [
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;

function initialsFrom(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

type SettingsModalContextValue = {
  open: (section?: SectionId) => void;
};

const SettingsModalContext = createContext<SettingsModalContextValue | null>(null);

export function useSettingsModal() {
  const context = useContext(SettingsModalContext);
  if (!context) {
    throw new Error("useSettingsModal must be used within a SettingsModalProvider");
  }
  return context;
}

export function SettingsModalProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState<SectionId>("profile");
  const [subview, setSubview] = useState<SubviewId | null>(null);
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(false);
  // Bumped after a save so the profile form remounts with the freshly persisted
  // values as its baseline — React 19 resets the form on action completion, so
  // without this the on-screen fields would snap back to their pre-save state.
  const [dataStamp, setDataStamp] = useState(0);
  // Lives on the modal (not the form) so the pill survives the post-save remount.
  const [showSaved, setShowSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setShowSaved(false);
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  const refreshData = useCallback(() => {
    void getSettingsData().then((result) => {
      setData(result);
      setDataStamp((stamp) => stamp + 1);
      setShowSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setShowSaved(false), 2000);
    });
  }, []);

  // Switching sidebar sections always drops any open sub-pane (e.g. Manage
  // emails) so we never leave the user stranded in a detail view.
  const selectSection = useCallback((next: SectionId) => {
    setSection(next);
    setSubview(null);
  }, []);

  // Fetch fresh data on each open (event-driven, not in an effect) so profile
  // edits and avatar uploads made earlier are always reflected.
  const open = useCallback((next?: SectionId) => {
    setSection(next ?? "profile");
    setSubview(null);
    setIsOpen(true);
    setLoading(true);
    void getSettingsData().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const activeSection = SECTIONS.find((item) => item.id === section)!;
  const displayName = user?.fullName || user?.username || "Your account";
  const avatarUrl = user?.imageUrl;
  const initials = initialsFrom(displayName);

  return (
    <SettingsModalContext.Provider value={{ open }}>
      {children}
      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#0f0f0f]/50 backdrop-blur-[2px]" onClick={close} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            className="border-app-border bg-app-canvas relative z-10 flex h-[min(720px,88vh)] w-[min(1040px,94vw)] flex-col overflow-hidden rounded-xl border shadow-[0_24px_48px_rgba(0,0,0,0.28),0_4px_12px_rgba(0,0,0,0.16)] sm:flex-row"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close settings"
              className="text-app-muted hover:bg-app-hover hover:text-app-fg absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            >
              <X size={18} strokeWidth={1.75} />
            </button>

            <aside className="border-app-border bg-app-surface flex shrink-0 gap-1 overflow-x-auto border-b p-3 sm:w-60 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto sm:border-r sm:border-b-0 sm:p-3">
              <p className="text-app-muted-2 mb-1 hidden px-2 text-xs font-medium sm:block">
                Account
              </p>

              <button
                type="button"
                onClick={() => selectSection("profile")}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  section === "profile"
                    ? "bg-app-surface-2 text-app-fg font-medium"
                    : "text-app-muted hover:bg-app-hover hover:text-app-fg",
                )}
              >
                <span className="border-app-border bg-app-canvas text-app-fg flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border text-[10px] font-semibold">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </span>
                <span className="truncate">{displayName}</span>
              </button>

              {SECONDARY_SECTIONS.map((item) => {
                const Icon = item.icon;
                const active = item.id === section;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectSection(item.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-app-surface-2 text-app-fg font-medium"
                        : "text-app-muted hover:bg-app-hover hover:text-app-fg",
                    )}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    {item.label}
                  </button>
                );
              })}
            </aside>

            <div className="min-w-0 flex-1 overflow-y-auto">
              <div className="mx-auto max-w-2xl px-4 py-8 sm:px-2">
                {subview === "emails" ? (
                  <EmailsPane sectionLabel="Security" onBack={() => setSubview(null)} />
                ) : (
                  <>
                    <div className="mb-8">
                      <h2 className="text-app-fg text-[26px] leading-8 font-semibold tracking-[-0.01em]">
                        {activeSection.title}
                      </h2>
                      <p className="text-app-muted mt-1.5 text-base">
                        {activeSection.description}
                      </p>
                    </div>

                    {loading || !data ? (
                      <div className="text-app-muted-2 py-16 text-center text-sm">Loading…</div>
                    ) : (
                      <>
                        {section === "profile" ? (
                          <>
                            <ProfileForm
                              key={dataStamp}
                              email={data.email}
                              initialValues={data.profile}
                              onSaved={refreshData}
                            />
                            {showSaved ? (
                              <div
                                role="status"
                                className="pointer-events-none fixed bottom-8 left-1/2 z-[130] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#1a7f4b]/25 bg-[#1a7f4b] px-3.5 py-2 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                              >
                                <Check size={14} strokeWidth={2.5} />
                                Saved
                              </div>
                            ) : null}
                          </>
                        ) : null}
                        {section === "preferences" ? (
                          <ThemeControl initial={data.themePreference} />
                        ) : null}
                        {section === "security" ? (
                          <SecurityPanel
                            userId={user?.id ?? ""}
                            confirmHandle={data.profile.username || data.email}
                            onManageEmails={() => setSubview("emails")}
                          />
                        ) : null}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SettingsModalContext.Provider>
  );
}
