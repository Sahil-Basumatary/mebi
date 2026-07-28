"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { Bell, FolderKanban, Home, LogOut, Moon, Settings, Sun, Users } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useSettingsModal } from "@/components/settings/settings-modal";

const menuLinks = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/projects", label: "Your projects", icon: FolderKanban },
  { href: "/partners", label: "Partners", icon: Users },
  { href: "/inbox", label: "Requests", icon: Bell },
];

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AccountMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { open: openSettings } = useSettingsModal();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const displayName = user?.fullName || user?.username || "Your account";
  const handle = user?.username
    ? `@${user.username}`
    : (user?.primaryEmailAddress?.emailAddress ?? "");
  const avatarUrl = user?.imageUrl;
  const initials = initialsFrom(displayName) || "?";

  const avatar = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
  ) : (
    initials
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        className="border-app-chrome-fg/25 bg-app-chrome-fg/10 text-app-chrome-fg hover:border-app-chrome-fg/50 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border text-xs font-semibold transition-colors"
      >
        {avatar}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="border-app-border bg-app-canvas absolute top-11 right-0 z-50 w-64 border py-1 shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                openSettings("profile");
              }}
              className="hover:bg-app-hover flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
            >
              <span className="border-app-border bg-app-surface text-app-fg flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-semibold">
                {avatar}
              </span>
              <span className="min-w-0">
                <span className="text-app-fg block truncate text-sm font-medium">
                  {displayName}
                </span>
                {handle ? (
                  <span className="text-app-muted-2 block truncate text-xs">{handle}</span>
                ) : null}
              </span>
            </button>

            <div className="bg-app-border my-1 h-px" />

            {menuLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="text-app-muted hover:bg-app-hover hover:text-app-fg flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}

            <div className="bg-app-border my-1 h-px" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                openSettings();
              }}
              className="text-app-muted hover:bg-app-hover hover:text-app-fg flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors"
            >
              <Settings size={16} strokeWidth={1.75} />
              Settings
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
              }}
              className="text-app-muted hover:bg-app-hover hover:text-app-fg flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun size={16} strokeWidth={1.75} />
              ) : (
                <Moon size={16} strokeWidth={1.75} />
              )}
              {mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            </button>

            <div className="bg-app-border my-1 h-px" />

            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ redirectUrl: "/" })}
              className="text-app-muted hover:bg-app-hover hover:text-app-fg flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors"
            >
              <LogOut size={16} strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
