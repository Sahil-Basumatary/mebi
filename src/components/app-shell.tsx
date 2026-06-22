"use client";

import { UserButton } from "@clerk/nextjs";
import {
  Bell,
  CalendarDays,
  FileText,
  FolderKanban,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Command Center", helper: "Today", icon: Home },
  { href: "/projects", label: "Project Pipeline", helper: "Build", icon: FolderKanban },
  { href: "/partners", label: "Partner Intelligence", helper: "Match", icon: Users },
  { href: "/inbox", label: "Requests Desk", helper: "Reply", icon: Bell },
];

const secondaryNavItems = [
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsCollapsed(window.localStorage.getItem("mebi:sidebar-collapsed") === "true");
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  function toggleSidebar() {
    setIsCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("mebi:sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 hidden border-r border-[#262626] bg-[#050505] py-4 transition-[width,padding] duration-200 md:flex md:flex-col",
          isCollapsed ? "w-20 px-2" : "w-20 px-2 lg:w-72 lg:px-3",
        )}
      >
        <div className={cn("mb-5 flex items-center gap-2", isCollapsed ? "justify-center px-0" : "px-3")}>
          <Link href="/dashboard" className={cn("flex min-w-0 items-center gap-3 py-2", isCollapsed && "justify-center")}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#ffffff] text-sm font-semibold">
              m
            </span>
            <span className={cn("min-w-0", isCollapsed ? "hidden" : "hidden lg:block")}>
              <span className="block truncate text-sm font-semibold tracking-tight">mebi</span>
              <span className="block truncate text-xs text-[#d8d8d8]">KCL project network</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            title={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={toggleSidebar}
            className={cn(
              "ml-auto hidden h-8 w-8 items-center justify-center rounded-md text-[#d8d8d8] transition-colors hover:bg-[#000000] hover:text-[#ffffff] lg:flex",
              isCollapsed && "ml-0",
            )}
          >
            {isCollapsed ? <PanelLeftOpen size={17} strokeWidth={1.75} /> : <PanelLeftClose size={17} strokeWidth={1.75} />}
          </button>
        </div>

        <div className={cn("mb-5 border border-[#262626] bg-[#000000] p-4", isCollapsed ? "hidden" : "hidden lg:block")}>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#8f8f8f] uppercase">
            Today&apos;s mission
          </p>
          <p className="mt-2 text-sm leading-6 text-[#d8d8d8]">
            Get one serious project from profile signal to buildable brief.
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "grid items-center rounded-md text-sm transition-colors",
                  isCollapsed
                    ? "h-11 grid-cols-1 justify-items-center px-0"
                    : "h-11 grid-cols-1 justify-items-center px-0 lg:h-auto lg:grid-cols-[1rem_1fr_auto] lg:justify-items-stretch lg:gap-3 lg:px-3 lg:py-2.5",
                  active
                    ? "bg-[#000000] text-[#ffffff]"
                    : "text-[#d8d8d8] hover:bg-[#000000] hover:text-[#ffffff]",
                )}
              >
                <Icon size={17} strokeWidth={1.75} />
                <span className={cn(isCollapsed ? "sr-only" : "sr-only lg:not-sr-only")}>{item.label}</span>
                <span className={cn("text-[11px] text-[#8f8f8f]", isCollapsed ? "hidden" : "hidden lg:block")}>
                  {item.helper}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-7 border-t border-[#262626] pt-5">
          <p className={cn("px-3 text-[11px] font-semibold tracking-[0.22em] text-[#8f8f8f] uppercase", isCollapsed ? "sr-only" : "sr-only lg:not-sr-only")}>
            Secondary
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "rounded-md text-sm transition-colors",
                    isCollapsed ? "flex h-11 items-center justify-center" : "flex h-11 items-center justify-center lg:h-auto lg:justify-start lg:gap-3 lg:px-3 lg:py-2",
                    active
                      ? "bg-[#000000] text-[#ffffff]"
                      : "text-[#d8d8d8] hover:bg-[#000000] hover:text-[#ffffff]",
                  )}
                >
                  <Icon size={16} strokeWidth={1.75} />
                  <span className={cn(isCollapsed ? "sr-only" : "sr-only lg:not-sr-only")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className={cn("mt-auto border-t border-[#262626] pt-4", isCollapsed ? "px-2" : "px-3")}>
          <p className={cn("text-[11px] font-semibold tracking-[0.22em] text-[#8f8f8f] uppercase", isCollapsed ? "sr-only" : "sr-only lg:not-sr-only")}>
            Workspace health
          </p>
          <div className="mt-3 h-1.5 bg-[#262626]">
            <div className="h-full w-1/4 bg-[#ffffff]" />
          </div>
          <p className={cn("mt-2 text-sm text-[#d8d8d8]", isCollapsed ? "sr-only" : "sr-only lg:not-sr-only")}>Profile ready. Project proof not started.</p>
        </div>
      </aside>

      {rightRail ? (
        <aside className="fixed inset-y-0 right-0 hidden w-72 border-l border-[#d8d8d8] bg-[#ffffff] px-5 py-5 text-[#000000] 2xl:block">
          {rightRail}
        </aside>
      ) : null}

      <div
        className={cn(
          "min-h-screen bg-[#ffffff] pb-20 text-[#000000] transition-[padding] duration-200 md:pb-0",
          isCollapsed ? "md:pl-20" : "md:pl-20 lg:pl-72",
          rightRail && "2xl:pr-72",
        )}
      >
        <header className="sticky top-0 z-50 border-b border-[#d8d8d8] bg-[#ffffff] px-4 text-[#000000] shadow-[0_1px_0_rgba(0,0,0,0.04)] lg:px-8">
          <div className="flex min-h-16 flex-col gap-3 py-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Search size={16} strokeWidth={1.75} />
              <div className="flex min-w-0 flex-1 items-center border border-[#d8d8d8] bg-[#f7f7f7] px-3 py-2 text-[#555555] shadow-soft">
                <span className="truncate text-xs">
                  Search projects, people, skills, requests, proof...
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="hidden items-center gap-2 text-xs text-[#555555] md:flex">
                <span>Press</span>
                <span className="border border-[#d8d8d8] bg-[#ffffff] px-2 py-1 font-mono text-[10px] text-[#000000]">
                  /
                </span>
                <span>to search when command mode ships</span>
              </div>
              <div className="flex items-center gap-2">
                <UserButton />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[#262626] bg-[#050505] px-2 py-2 text-[#d8d8d8] md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[10px] transition-colors",
                active ? "bg-[#000000] text-[#ffffff]" : "hover:bg-[#000000] hover:text-[#ffffff]",
              )}
            >
              <Icon size={17} strokeWidth={1.75} />
              <span className="max-w-full truncate">{item.label.replace("Project ", "").replace("Partner ", "")}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
