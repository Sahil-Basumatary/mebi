"use client";

import { UserButton } from "@clerk/nextjs";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  FileText,
  FolderKanban,
  Home,
  Search,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", label: "Command Center", short: "Home", icon: Home },
  { href: "/projects", label: "Project Pipeline", short: "Projects", icon: FolderKanban },
  { href: "/partners", label: "Partner Intelligence", short: "Partners", icon: Users },
  { href: "/inbox", label: "Requests Desk", short: "Requests", icon: Bell },
];

const secondaryNav = [
  { href: "/community", label: "Proof Library", icon: FileText },
  { href: "/events", label: "Events & Signals", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

type AppShellProps = {
  children: ReactNode;
  rightRail?: ReactNode;
};

export function AppShell({ children, rightRail }: AppShellProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#000000]">
      <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#000000] text-[#ffffff]">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-7">
            <Link
              href="/dashboard"
              className="flex h-9 items-center border border-[#ffffff] px-2.5 font-[family-name:var(--font-newsreader)] text-xl leading-none font-light tracking-[-0.04em]"
            >
              mebi
            </Link>
            <nav className="hidden items-center gap-7 md:flex">
              {primaryNav.map((item) => (
                <Link key={item.href} href={item.href} className="group relative py-1 text-[13px] font-medium tracking-[-0.01em]">
                  <span
                    className={cn(
                      isActive(item.href)
                        ? "text-[#ffffff]"
                        : "text-[#9a9a9a] transition-colors group-hover:text-[#ffffff]",
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-1/2 h-px -translate-x-1/2 bg-[#ffffff] transition-all duration-300 ease-out",
                      isActive(item.href) ? "w-full" : "w-0 group-hover:w-full",
                    )}
                  />
                </Link>
              ))}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMoreOpen((value) => !value)}
                  className="flex items-center gap-1 py-1 text-[13px] font-medium tracking-[-0.01em] text-[#9a9a9a] transition-colors hover:text-[#ffffff]"
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
                    <div className="absolute top-9 left-0 z-50 w-56 border border-[#1f1f1f] bg-[#0a0a0a] p-1 shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
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
                                ? "bg-[#161616] text-[#ffffff]"
                                : "text-[#bdbdbd] hover:bg-[#161616] hover:text-[#ffffff]",
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
              className="hidden items-center gap-2 border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-[#9a9a9a] transition-colors hover:border-[#3a3a3a] hover:text-[#dddddd] sm:flex"
            >
              <Search size={15} strokeWidth={1.75} />
              <span>Search</span>
              <span className="ml-2 border border-[#2a2a2a] px-1.5 py-0.5 font-mono text-[10px] text-[#9a9a9a]">
                ⌘K
              </span>
            </button>
            <UserButton />
          </div>
        </div>
      </header>

      {rightRail ? (
        <aside className="fixed top-16 right-0 bottom-0 hidden w-72 border-l border-[#d8d8d8] bg-[#ffffff] px-5 py-5 text-[#000000] 2xl:block">
          {rightRail}
        </aside>
      ) : null}

      <div className={cn("min-h-screen bg-[#ffffff] pb-20 text-[#000000] md:pb-0", rightRail && "2xl:pr-72")}>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[#1a1a1a] bg-[#000000] px-2 py-2 text-[#9a9a9a] md:hidden">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] transition-colors",
                isActive(item.href) ? "text-[#ffffff]" : "hover:text-[#ffffff]",
              )}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="max-w-full truncate">{item.short}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
