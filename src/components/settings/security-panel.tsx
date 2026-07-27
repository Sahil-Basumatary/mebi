"use client";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { Check, CircleAlert, Copy, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { deleteAccount } from "./actions";
import { EmailRow } from "./email-manager";
import { PasskeysControl } from "./passkeys";
import { ChangePasswordControl } from "./password-modal";
import { TwoFactorControl } from "./two-factor";

const outlineButton =
  "border-app-border text-app-fg hover:bg-app-hover flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-sm font-medium transition-colors";
// Notion's destructive actions are borderless red text buttons (rgb(229,100,88)).
const dangerButton =
  "flex h-7 shrink-0 items-center rounded-md px-2 text-sm font-medium text-[#e56458] transition-colors hover:bg-[#e56458]/10 disabled:opacity-50";

// Derive Clerk's session-activity shape from the user resource so we stay typed
// without importing @clerk/types directly.
type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;
type SessionRow = Awaited<ReturnType<ClerkUser["getSessions"]>>[number];

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-app-fg border-app-border mb-4 border-b pb-3 text-base font-medium">
      {children}
    </h3>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="text-app-fg text-sm font-medium">{label}</p>
        <p className="text-app-muted text-[13px] leading-[18px]">{description}</p>
      </div>
      {children}
    </div>
  );
}

function deviceLabel(activity: SessionRow["latestActivity"]): string {
  const parts = [activity?.browserName, activity?.deviceType].filter(Boolean);
  return parts.join(" · ") || "Unknown device";
}

function locationLabel(activity: SessionRow["latestActivity"]): string {
  const parts = [activity?.city, activity?.country].filter(Boolean);
  return parts.join(", ") || "—";
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function DeviceSessions() {
  const { user } = useUser();
  const { sessionId } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const rows = await user.getSessions();
    // Current device first, then most recently active.
    rows.sort((a, b) => {
      if (a.id === sessionId) return -1;
      if (b.id === sessionId) return 1;
      return b.lastActiveAt.getTime() - a.lastActiveAt.getTime();
    });
    setSessions(rows);
  }, [user, sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(row: SessionRow) {
    setRevoking(row.id);
    try {
      await row.revoke();
      setSessions((current) => current?.filter((item) => item.id !== row.id) ?? null);
    } catch {
      // Leave the row in place if the revoke fails; the user can retry.
    } finally {
      setRevoking(null);
    }
  }

  if (sessions === null) {
    return (
      <div className="text-app-muted-2 flex items-center gap-2 py-4 text-sm">
        <Loader2 size={14} className="animate-spin" />
        Loading devices…
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="text-app-muted-2 border-app-border grid grid-cols-[1.4fr_1fr_1.4fr_auto] gap-4 border-b pb-2 text-xs font-medium">
        <span>Device</span>
        <span>Last active</span>
        <span>Location</span>
        <span />
      </div>
      {sessions.map((row) => {
        const current = row.id === sessionId;
        return (
          <div
            key={row.id}
            className="border-app-border grid grid-cols-[1.4fr_1fr_1.4fr_auto] items-center gap-4 border-b py-2.5 text-[13px]"
          >
            <span className="text-app-fg flex min-w-0 items-center gap-2 truncate">
              <span className="truncate">{deviceLabel(row.latestActivity)}</span>
              {current ? (
                <span className="text-[#2783de]" aria-label="Current device">
                  This device
                </span>
              ) : null}
            </span>
            <span className="text-app-muted truncate">
              {current ? "Now" : dateFormatter.format(row.lastActiveAt)}
            </span>
            <span className="text-app-muted truncate">{locationLabel(row.latestActivity)}</span>
            <span className="flex justify-end">
              {current ? null : (
                <button
                  type="button"
                  onClick={() => revoke(row)}
                  disabled={revoking === row.id}
                  className="border-app-border text-app-muted hover:bg-app-hover hover:text-app-fg flex h-7 items-center rounded-md border px-2 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {revoking === row.id ? "Logging out…" : "Log out"}
                </button>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DeleteAccount({ confirmHandle }: { confirmHandle: string }) {
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phrase = `sudo delete ${confirmHandle}`;
  const canDelete = value.trim() === phrase && !pending;

  const cancel = useCallback(() => {
    setPending((current) => {
      // Never let a cancel interrupt an in-flight deletion.
      if (current) return current;
      setOpen(false);
      setValue("");
      setError(null);
      return current;
    });
  }, []);

  // Escape should only dismiss this confirmation, not the settings modal behind
  // it, so we intercept in the capture phase and stop it from propagating.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        cancel();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, cancel]);

  async function confirmDelete() {
    if (!canDelete) return;
    setPending(true);
    setError(null);
    const result = await deleteAccount();
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    // Identity is gone server-side; clear the local session and leave the app.
    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      window.location.href = "/";
    }
  }

  return (
    <>
      <Row
        label="Delete my account"
        description="Permanently delete your account. You'll lose access to your profile, projects, requests, and memberships."
      >
        <button type="button" onClick={() => setOpen(true)} className={dangerButton}>
          Delete my account
        </button>
      </Row>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-[#0f0f0f]/50 backdrop-blur-[2px]"
                onClick={cancel}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Delete account confirmation"
                className="border-app-border bg-app-canvas relative z-10 w-[420px] max-w-[92vw] rounded-xl border p-5 shadow-[0_24px_48px_rgba(25,25,25,0.24),0_4px_12px_rgba(25,25,25,0.14)]"
              >
                <div className="flex flex-col items-center text-center">
                  <CircleAlert size={36} strokeWidth={1.75} className="text-[#e56458]" />
                  <h2 className="text-app-fg mt-2.5 text-[17px] leading-[22px] font-semibold">
                    Delete your entire account permanently?
                  </h2>
                  <p className="text-app-muted mt-2 text-[14px] leading-5">
                    This action cannot be undone. Your entire account will be permanently deleted,
                    including your profile, projects, build requests, memberships, and any
                    proof you have logged.
                  </p>
                </div>

                <label className="text-app-fg mt-5 block text-[14px] leading-5">
                  Please type{" "}
                  <code className="text-app-fg bg-app-surface-2 rounded px-1 py-0.5 font-mono text-[13px]">
                    {phrase}
                  </code>{" "}
                  to confirm.
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={phrase}
                  className="border-app-border bg-app-surface text-app-fg placeholder:text-app-muted-2 focus:border-app-border-strong mt-3 h-9 w-full rounded-md border px-2.5 text-[14px] outline-none"
                />
                {error ? <p className="mt-2 text-[13px] text-[#e56458]">{error}</p> : null}

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={!canDelete}
                  className="mt-6 flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-[#e56458] text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Permanently delete account
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  disabled={pending}
                  className="text-app-muted hover:bg-app-hover hover:text-app-fg mt-2 flex h-8 w-full items-center justify-center rounded-md text-[14px] font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function SecurityPanel({
  userId,
  confirmHandle,
  onManageEmails,
}: {
  userId: string;
  confirmHandle: string;
  onManageEmails: () => void;
}) {
  const { signOut } = useClerk();
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can reject without user gesture/permission; ignore silently.
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <SectionHeading>Account security</SectionHeading>
        <EmailRow onManage={onManageEmails} />
        <Row label="Password" description="Change the password you use to log in">
          <ChangePasswordControl />
        </Row>
        <Row
          label="Two-step verification"
          description="Add another layer of security to your account"
        >
          <TwoFactorControl />
        </Row>
        <Row label="Passkeys" description="Sign in with on-device biometric authentication">
          <PasskeysControl />
        </Row>
      </section>

      <section className="space-y-5">
        <SectionHeading>Devices</SectionHeading>
        <Row
          label="Log out of all devices"
          description="Log out of active sessions on all your devices, other than this one"
        >
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className={dangerButton}
          >
            Log out of all devices
          </button>
        </Row>
        <DeviceSessions />
      </section>

      <section className="space-y-5">
        <SectionHeading>Delete account</SectionHeading>
        <DeleteAccount confirmHandle={confirmHandle} />
      </section>

      <section className="space-y-5">
        <SectionHeading>User ID</SectionHeading>
        <Row label="User ID" description={userId}>
          <button type="button" onClick={copyId} className={outlineButton}>
            {copied ? (
              <>
                <Check size={14} strokeWidth={2} />
                Copied
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={1.75} />
                Copy
              </>
            )}
          </button>
        </Row>
      </section>
    </div>
  );
}
