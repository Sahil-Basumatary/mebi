"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { Bell, FolderKanban, Home, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const menuLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Navigating away should never leave the menu floating over a fresh page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#2a2a2a] bg-[#161616] text-xs font-semibold text-[#dddddd] transition-colors hover:border-[#4a4a4a]"
      >
        {avatar}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute top-11 right-0 z-50 w-64 border border-[#1f1f1f] bg-[#0a0a0a] py-1 shadow-[0_24px_70px_rgba(0,0,0,0.6)]"
          >
            <Link
              href="/settings"
              role="menuitem"
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#161616]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#2a2a2a] bg-[#161616] text-xs font-semibold text-[#dddddd]">
                {avatar}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[#ffffff]">{displayName}</span>
                {handle ? <span className="block truncate text-xs text-[#8a8a8a]">{handle}</span> : null}
              </span>
            </Link>

            <div className="my-1 h-px bg-[#1a1a1a]" />

            {menuLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[#bdbdbd] transition-colors hover:bg-[#161616] hover:text-[#ffffff]"
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}

            <div className="my-1 h-px bg-[#1a1a1a]" />

            <Link
              href="/settings"
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2 text-sm text-[#bdbdbd] transition-colors hover:bg-[#161616] hover:text-[#ffffff]"
            >
              <Settings size={16} strokeWidth={1.75} />
              Settings
            </Link>

            <div className="my-1 h-px bg-[#1a1a1a]" />

            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ redirectUrl: "/" })}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[#bdbdbd] transition-colors hover:bg-[#161616] hover:text-[#ffffff]"
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
