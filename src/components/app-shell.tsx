"use client";

import {
  Bell,
  ChevronDown,
  FileText,
  FolderKanban,
  Home,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AccountMenu } from "@/components/account-menu";
import {
  KeyboardShortcutsProvider,
  useKeyboardShortcuts,
} from "@/components/keyboard-shortcuts-provider";
import { SkipLink } from "@/components/layout/skip-link";
import {
  SettingsModalHost,
  SettingsModalProvider,
} from "@/components/settings/settings-modal";
import { formatCombo } from "@/lib/keyboard-shortcuts";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: typeof Home;
};

// Prefer left-to-right. Leaderboard sits next to Projects; overflow only moves
// into More when the bar would collide with Search.
const allNavItems: NavItem[] = [
  { href: "/home", label: "Home", short: "Home", icon: Home },
  { href: "/projects", label: "Projects", short: "Projects", icon: FolderKanban },
  { href: "/leaderboard", label: "Leaderboard", short: "Board", icon: Trophy },
  { href: "/discover", label: "Discover", short: "Discover", icon: Search },
  { href: "/partners", label: "Partners", short: "Partners", icon: Users },
  { href: "/inbox", label: "Requests", short: "Requests", icon: Bell },
  { href: "/proof", label: "Proof", short: "Proof", icon: FileText },
];

const MOBILE_NAV = [
  allNavItems[0],
  allNavItems[1],
  allNavItems[2],
  allNavItems[3],
  allNavItems[5],
];

const railRoutes = new Set(["/projects", "/partners", "/inbox"]);

type AppShellProps = {
  children: ReactNode;
  rail?: ReactNode;
  spine?: ReactNode;
};

export function AppShell({ children, rail, spine }: AppShellProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadRequests, setUnreadRequests] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/inbox/unread")
      .then((response) => (response.ok ? response.json() : { count: 0 }))
      .then((data: { count?: number }) => {
        if (active) setUnreadRequests(data.count ?? 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <SettingsModalProvider>
      <KeyboardShortcutsProvider>
        <AppShellChrome
          unreadRequests={unreadRequests}
          moreOpen={moreOpen}
          setMoreOpen={setMoreOpen}
          isActive={isActive}
          hasRail={railRoutes.has(pathname)}
          rail={rail}
          spine={spine}
        >
          {children}
        </AppShellChrome>
        <SettingsModalHost />
      </KeyboardShortcutsProvider>
    </SettingsModalProvider>
  );
}

function navLabel(item: NavItem, unreadRequests: number) {
  if (item.href === "/inbox" && unreadRequests > 0) {
    return `${item.label}, ${unreadRequests} unread`;
  }
  return item.label;
}

function AppShellChrome({
  children,
  rail,
  spine,
  hasRail,
  unreadRequests,
  moreOpen,
  setMoreOpen,
  isActive,
}: {
  children: ReactNode;
  rail?: ReactNode;
  spine?: ReactNode;
  hasRail: boolean;
  unreadRequests: number;
  moreOpen: boolean;
  setMoreOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  isActive: (href: string) => boolean;
}) {
  const { openPalette, bindings } = useKeyboardShortcuts();
  const navSlotRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreMeasureRef = useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = useState(allNavItems.length);

  useLayoutEffect(() => {
    const slot = navSlotRef.current;
    const measure = measureRef.current;
    if (!slot || !measure) return;

    function recompute() {
      if (!slot || !measure) return;
      const available = slot.clientWidth;
      const moreWidth = moreMeasureRef.current?.offsetWidth ?? 72;
      const styles = getComputedStyle(measure);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "24") || 24;
      const itemNodes = Array.from(measure.children) as HTMLElement[];
      const widths = itemNodes.map((node) => node.offsetWidth);

      let used = 0;
      let fit = 0;
      for (let i = 0; i < widths.length; i += 1) {
        const next = used + (fit > 0 ? gap : 0) + widths[i];
        const remaining = widths.length - (i + 1);
        const needMore = remaining > 0;
        const budget = needMore ? available - moreWidth - gap : available;
        if (next > budget) break;
        used = next;
        fit = i + 1;
      }

      if (fit === 0 && widths.length > 0) fit = 1;
      setVisibleCount(fit);
    }

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(slot);
    window.addEventListener("resize", recompute);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [visibleCount, setMoreOpen]);

  const visibleItems = allNavItems.slice(0, visibleCount);
  const overflowItems = allNavItems.slice(visibleCount);

  return (
    <div className="bg-app-canvas text-app-fg min-h-screen">
      <SkipLink />
      <header className="border-app-chrome-border bg-app-chrome text-app-chrome-fg sticky top-0 z-50 border-b">
        <div className="mx-auto flex h-16 w-full max-w-[88rem] items-center justify-between gap-6 px-6 lg:px-12">
          <div className="flex min-w-0 flex-1 items-center gap-8">
            <Link
              href="/home"
              className="border-app-chrome-fg hover:bg-app-chrome-fg hover:text-app-chrome flex h-10 shrink-0 items-center border px-3 font-[family-name:var(--font-newsreader)] text-[1.4rem] leading-none font-light tracking-[-0.04em] transition-colors"
            >
              mebi
            </Link>
            <div ref={navSlotRef} className="relative hidden min-w-0 flex-1 lg:block">
              <div
                ref={measureRef}
                aria-hidden
                className="pointer-events-none absolute top-0 left-0 flex items-center gap-6 opacity-0 xl:gap-8"
              >
                {allNavItems.map((item) => (
                  <span
                    key={item.href}
                    className="py-1 text-[14px] font-medium tracking-[-0.01em] whitespace-nowrap"
                  >
                    {item.label}
                  </span>
                ))}
              </div>
              <button
                ref={moreMeasureRef}
                type="button"
                tabIndex={-1}
                aria-hidden
                className="pointer-events-none absolute top-0 left-0 flex items-center gap-1 py-1 text-[14px] font-medium tracking-[-0.01em] opacity-0"
              >
                More
                <ChevronDown size={14} strokeWidth={1.75} />
              </button>
              <nav aria-label="Primary" className="flex items-center gap-6 xl:gap-8">
                {visibleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    aria-label={navLabel(item, unreadRequests)}
                    className="group relative py-1 text-[14px] font-medium tracking-[-0.01em] whitespace-nowrap"
                  >
                    <span
                      className={cn(
                        isActive(item.href)
                          ? "text-app-chrome-fg"
                          : "text-app-chrome-muted group-hover:text-app-chrome-fg transition-colors",
                      )}
                    >
                      {item.label}
                    </span>
                    {item.href === "/inbox" && unreadRequests > 0 ? (
                      <span
                        aria-hidden
                        className="bg-app-signal absolute -top-0.5 -right-2.5 h-1.5 w-1.5 rounded-full"
                      />
                    ) : null}
                    <span
                      aria-hidden
                      className={cn(
                        "bg-app-chrome-fg absolute -bottom-0.5 left-1/2 h-px -translate-x-1/2 transition-all duration-300 ease-out",
                        isActive(item.href) ? "w-full" : "w-0 group-hover:w-full",
                      )}
                    />
                  </Link>
                ))}

                {overflowItems.length > 0 ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMoreOpen((value) => !value)}
                      aria-expanded={moreOpen}
                      aria-haspopup="menu"
                      className="text-app-chrome-muted hover:text-app-chrome-fg flex items-center gap-1 py-1 text-[14px] font-medium tracking-[-0.01em] transition-colors"
                    >
                      More
                      <ChevronDown
                        size={14}
                        strokeWidth={1.75}
                        aria-hidden
                        className={cn("transition-transform", moreOpen && "rotate-180")}
                      />
                    </button>
                    {moreOpen ? (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                        <div
                          role="menu"
                          className="border-app-border bg-app-canvas absolute top-9 left-0 z-50 w-56 border p-1 shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
                        >
                          {overflowItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                role="menuitem"
                                onClick={() => setMoreOpen(false)}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                                  isActive(item.href)
                                    ? "bg-app-surface text-app-fg"
                                    : "text-app-muted hover:bg-app-hover hover:text-app-fg",
                                )}
                              >
                                <Icon size={16} strokeWidth={1.75} aria-hidden />
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </nav>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={openPalette}
              aria-label={`Search (${formatCombo(bindings.search)})`}
              title={`Search (${formatCombo(bindings.search)})`}
              className="border-app-chrome-fg/25 bg-app-chrome-fg/5 text-app-chrome-muted hover:border-app-chrome-fg/40 hover:text-app-chrome-fg hidden w-72 items-center gap-2 border px-3 py-2 text-xs transition-colors sm:flex"
            >
              <Search size={15} strokeWidth={1.75} aria-hidden />
              <span>Search</span>
              <span className="border-app-chrome-fg/25 text-app-chrome-muted ml-auto border px-1.5 py-0.5 font-mono text-[10px]">
                {formatCombo(bindings.search)}
              </span>
            </button>
            <AccountMenu />
          </div>
        </div>
      </header>

      {spine}

      <div className="bg-app-canvas text-app-fg min-h-screen pb-20 lg:pb-0">
        <div className="mx-auto flex w-full max-w-[88rem] items-start gap-8 px-6 lg:px-12">
          <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 py-6 outline-none">
            {children}
          </main>
          {hasRail ? (
            <aside
              aria-label="Context rail"
              className="border-app-border-strong sticky top-16 hidden max-h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-l py-6 pl-6 xl:block"
            >
              {rail}
            </aside>
          ) : null}
        </div>
      </div>

      <nav
        aria-label="Mobile primary"
        className="border-app-chrome-border bg-app-chrome text-app-chrome-muted fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t px-2 py-2 lg:hidden"
      >
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              aria-label={navLabel(item, unreadRequests)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] transition-colors",
                isActive(item.href) ? "text-app-chrome-fg" : "hover:text-app-chrome-fg",
              )}
            >
              <span className="relative">
                <Icon size={18} strokeWidth={1.75} aria-hidden />
                {item.href === "/inbox" && unreadRequests > 0 ? (
                  <span
                    aria-hidden
                    className="bg-app-signal absolute -top-1 -right-1.5 h-1.5 w-1.5 rounded-full"
                  />
                ) : null}
              </span>
              <span className="max-w-full truncate" aria-hidden>
                {item.short}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
