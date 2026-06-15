"use client";

import { UserButton } from "@clerk/nextjs";
import {
  Bell,
  CalendarDays,
  FolderKanban,
  Home,
  MessageSquareText,
  Search,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/partners", label: "Browse partners", icon: Users },
  { href: "/inbox", label: "Inbox", icon: Bell },
  { href: "/community", label: "Community", icon: MessageSquareText },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface px-3 py-4 lg:block">
        <Link href="/dashboard" className="mb-6 flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border-strong text-sm font-semibold">
            m
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">mebi</span>
            <span className="text-muted block text-xs">KCL project network</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-hover text-foreground" : "text-muted hover:bg-hover hover:text-foreground",
                )}
              >
                <Icon size={17} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-canvas/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-muted shadow-soft sm:flex">
              <Search size={16} strokeWidth={1.75} />
              <span className="text-xs">Search people, projects, skills</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
