"use client";

import {
  Bell,
  CalendarDays,
  ChevronDown,
  FileText,
  FolderKanban,
  Home,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AccountMenu } from "@/components/account-menu";
import { SettingsModalProvider } from "@/components/settings/settings-modal";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", label: "Command Center", short: "Home", icon: Home },
  { href: "/projects", label: "Projects", short: "Projects", icon: FolderKanban },
  { href: "/partners", label: "Partners", short: "Partners", icon: Users },
  { href: "/inbox", label: "Requests", short: "Requests", icon: Bell },
  { href: "/community", label: "Proof", short: "Proof", icon: FileText },
  { href: "/events", label: "Events", short: "Events", icon: CalendarDays },
];

// Overflow sections move here once the top bar runs out of room. Empty for now
// so the bar stays flat, but the menu wiring stays ready for scale.
const secondaryNav: { href: string; label: string; icon: typeof Home }[] = [];

type AppShellProps = {
  children: ReactNode;
  rightRail?: ReactNode;
};

export function AppShell({ children, rightRail }: AppShellProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadRequests, setUnreadRequests] = useState(0);

  // Refresh the unread count on every route change so visiting the inbox (which
  // clears notifications server-side) immediately drops the red dot.
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
      <div className="bg-app-canvas text-app-fg min-h-screen">
        <header className="border-app-chrome-border bg-app-chrome text-app-chrome-fg sticky top-0 z-50 border-b">
          <div className="mx-auto flex h-16 w-full max-w-[88rem] items-center justify-between gap-6 px-6 lg:px-12">
            <div className="flex min-w-0 items-center gap-8">
              <Link
                href="/dashboard"
                className="border-app-chrome-fg hover:bg-app-chrome-fg hover:text-app-chrome flex h-10 items-center border px-3 font-[family-name:var(--font-newsreader)] text-[1.4rem] leading-none font-light tracking-[-0.04em] transition-colors"
              >
                mebi
              </Link>
              <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
                {primaryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative py-1 text-[14px] font-medium tracking-[-0.01em]"
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
                      <span className="absolute -top-0.5 -right-2.5 h-1.5 w-1.5 rounded-full bg-[#ff4d4d]" />
                    ) : null}
                    <span
                      className={cn(
                        "bg-app-chrome-fg absolute -bottom-0.5 left-1/2 h-px -translate-x-1/2 transition-all duration-300 ease-out",
                        isActive(item.href) ? "w-full" : "w-0 group-hover:w-full",
                      )}
                    />
                  </Link>
                ))}

                <div className={cn("relative", secondaryNav.length === 0 && "hidden")}>
                  <button
                    type="button"
                    onClick={() => setMoreOpen((value) => !value)}
                    className="text-app-chrome-muted hover:text-app-chrome-fg flex items-center gap-1 py-1 text-[14px] font-medium tracking-[-0.01em] transition-colors"
                  >
                    More
                    <ChevronDown
                      size={14}
                      strokeWidth={1.75}
                      className={cn("transition-transform", moreOpen && "rotate-180")}
                    />
                  </button>
                  {moreOpen ? (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                      <div className="border-app-border bg-app-canvas absolute top-9 left-0 z-50 w-56 border p-1 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                        {secondaryNav.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMoreOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                                isActive(item.href)
                                  ? "bg-app-surface text-app-fg"
                                  : "text-app-muted hover:bg-app-hover hover:text-app-fg",
                              )}
                            >
                              <Icon size={16} strokeWidth={1.75} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                title="Command palette ships in the next milestone"
                className="border-app-chrome-fg/25 bg-app-chrome-fg/5 text-app-chrome-muted hover:border-app-chrome-fg/40 hover:text-app-chrome-fg hidden w-72 items-center gap-2 border px-3 py-2 text-xs transition-colors sm:flex"
              >
                <Search size={15} strokeWidth={1.75} />
                <span>Search</span>
                <span className="border-app-chrome-fg/25 text-app-chrome-muted ml-auto border px-1.5 py-0.5 font-mono text-[10px]">
                  ⌘K
                </span>
              </button>
              <AccountMenu />
            </div>
          </div>
        </header>

        {rightRail ? (
          <aside className="border-app-border-strong bg-app-canvas text-app-fg fixed top-16 right-0 bottom-0 hidden w-72 border-l px-5 py-5 2xl:block">
            {rightRail}
          </aside>
        ) : null}

        <div
          className={cn(
            "bg-app-canvas text-app-fg min-h-screen pb-20 lg:pb-0",
            rightRail && "2xl:pr-72",
          )}
        >
          <main className="mx-auto w-full max-w-[88rem] px-6 py-8 lg:px-12">{children}</main>
        </div>

        <nav className="border-app-chrome-border bg-app-chrome text-app-chrome-muted fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t px-2 py-2 lg:hidden">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] transition-colors",
                  isActive(item.href) ? "text-app-chrome-fg" : "hover:text-app-chrome-fg",
                )}
              >
                <span className="relative">
                  <Icon size={18} strokeWidth={1.75} />
                  {item.href === "/inbox" && unreadRequests > 0 ? (
                    <span className="absolute -top-1 -right-1.5 h-1.5 w-1.5 rounded-full bg-[#ff4d4d]" />
                  ) : null}
                </span>
                <span className="max-w-full truncate">{item.short}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </SettingsModalProvider>
  );
}
