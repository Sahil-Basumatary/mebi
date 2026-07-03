"use client";

import { useClerk } from "@clerk/nextjs";
import { KeyRound, LogOut } from "lucide-react";

export function SecurityPanel() {
  const { openUserProfile, signOut } = useClerk();

  return (
    <div className="space-y-8 pt-2">
      <div className="space-y-3">
        <div>
          <p className="text-app-fg text-sm font-medium">Account security</p>
          <p className="text-app-muted text-sm">
            Manage your email, password, two-step verification, and passkeys.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openUserProfile()}
          className="bg-app-accent text-app-accent-fg hover:bg-app-accent-hover inline-flex h-10 items-center gap-2 rounded-md px-5 text-sm font-medium transition-colors"
        >
          <KeyRound size={16} strokeWidth={1.75} />
          Manage account
        </button>
      </div>

      <div className="border-app-border border-t pt-6">
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: "/" })}
          className="border-app-border text-app-fg hover:bg-app-hover inline-flex h-10 items-center gap-2 rounded-md border px-5 text-sm font-medium transition-colors"
        >
          <LogOut size={16} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </div>
  );
}
