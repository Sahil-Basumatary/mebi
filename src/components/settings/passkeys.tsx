"use client";

import { useReverification, useUser } from "@clerk/nextjs";
import { Fingerprint, KeyRound, Loader2, MoreHorizontal, Plus, X } from "lucide-react";
import { useCallback, useEffect, useReducer, useState } from "react";
import { createPortal } from "react-dom";
import { useReverificationHandler } from "./reverification";

type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;
type PasskeyResource = ClerkUser["passkeys"][number];

const outlineRowButton =
  "border-app-border text-app-fg hover:bg-app-hover flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-sm font-medium transition-colors";
const blueButton =
  "flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#2783de] text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "errors" in error) {
    const list = (error as { errors?: { message?: string }[] }).errors;
    if (list?.[0]?.message) return list[0].message;
  }
  return "Something went wrong. Please try again.";
}

// Notion labels each passkey with a coarse "Set up N ago" rather than a timestamp.
function relativeSetup(date: Date): string {
  const diff = Math.max(0, Date.now() - date.getTime());
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "Set up today";
  if (days < 30) return `Set up ${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Set up ${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `Set up ${years} year${years === 1 ? "" : "s"} ago`;
}

function PasskeyRow({
  passkey,
  menuOpen,
  onMenu,
  onRename,
  onDelete,
}: {
  passkey: PasskeyResource;
  menuOpen: boolean;
  onMenu: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border-app-border flex items-center justify-between gap-3 rounded-lg border p-3">
      <span className="flex min-w-0 items-center gap-3">
        <KeyRound size={18} strokeWidth={1.75} className="text-app-fg shrink-0" />
        <span className="min-w-0">
          <span className="text-app-fg block truncate text-sm font-medium">
            {passkey.name || "Passkey"}
          </span>
          <span className="text-app-muted block text-[13px] leading-[18px]">
            {relativeSetup(passkey.createdAt)}
          </span>
        </span>
      </span>
      <span className="relative">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Passkey options"
          className="text-app-muted hover:bg-app-hover hover:text-app-fg flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        >
          <MoreHorizontal size={16} strokeWidth={1.75} />
        </button>
        {menuOpen ? (
          <>
            <div className="fixed inset-0 z-10" onClick={onMenu} />
            <div className="border-app-border bg-app-canvas absolute top-8 right-0 z-20 w-40 rounded-lg border p-1 shadow-[0_3px_6px_rgba(0,0,0,0.08),0_9px_24px_rgba(0,0,0,0.14)]">
              <button
                type="button"
                onClick={onRename}
                className="text-app-fg hover:bg-app-hover flex h-7 w-full items-center rounded-md px-2 text-sm transition-colors"
              >
                Rename passkey
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="hover:bg-app-hover flex h-7 w-full items-center rounded-md px-2 text-sm text-[#e56458] transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        ) : null}
      </span>
    </div>
  );
}

export function PasskeysControl() {
  const { user, isLoaded } = useUser();
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { onNeedsReverification } = useReverificationHandler();
  const createPasskey = useReverification(() => user!.createPasskey(), { onNeedsReverification });
  const renamePasskey = useReverification(
    (passkey: PasskeyResource, name: string) => passkey.update({ name }),
    { onNeedsReverification },
  );
  const removePasskey = useReverification((passkey: PasskeyResource) => passkey.delete(), {
    onNeedsReverification,
  });

  const cancel = useCallback(() => {
    setBusy((current) => {
      if (current) return current;
      setOpen(false);
      setError(null);
      setMenuFor(null);
      setEditingId(null);
      return current;
    });
  }, []);

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

  if (!isLoaded || !user) {
    return (
      <button type="button" disabled className={outlineRowButton}>
        Manage passkeys
      </button>
    );
  }

  const passkeys = user.passkeys;

  async function add() {
    setBusy(true);
    setError(null);
    try {
      await createPasskey();
      await user!.reload();
      refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function saveRename(passkey: PasskeyResource) {
    const name = editingName.trim();
    setEditingId(null);
    if (!name || name === passkey.name) return;
    setError(null);
    try {
      await renamePasskey(passkey, name);
      await user!.reload();
      refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function remove(passkey: PasskeyResource) {
    setMenuFor(null);
    setError(null);
    try {
      await removePasskey(passkey);
      await user!.reload();
      refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={outlineRowButton}>
        Manage passkeys
      </button>

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
                aria-label="Manage passkeys"
                className="border-app-border bg-app-canvas relative z-10 w-[400px] max-w-[92vw] rounded-xl border p-6 shadow-[0_24px_48px_rgba(25,25,25,0.24),0_4px_12px_rgba(25,25,25,0.14)]"
              >
                <button
                  type="button"
                  onClick={cancel}
                  aria-label="Close"
                  className="text-app-muted hover:bg-app-hover hover:text-app-fg absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>

                <div className="flex flex-col items-center text-center">
                  <Fingerprint size={28} strokeWidth={1.75} className="text-app-fg" />
                  <h2 className="text-app-fg mt-2 text-[17px] leading-[22px] font-semibold">
                    Manage passkeys
                  </h2>
                  <p className="text-app-muted mt-2 text-[14px] leading-5">
                    Use your device&apos;s built-in security features like Face ID to sign in instead
                    of remembering passwords.
                  </p>
                </div>

                {passkeys.length > 0 ? (
                  <>
                    <p className="text-app-muted-2 mt-5 text-xs font-medium">
                      {passkeys.length === 1 ? "Active passkey" : "Active passkeys"}
                    </p>
                    <div className="mt-2 space-y-1">
                      {passkeys.map((passkey) =>
                        editingId === passkey.id ? (
                          <div
                            key={passkey.id}
                            className="border-app-border flex items-center gap-3 rounded-lg border p-3"
                          >
                            <KeyRound
                              size={18}
                              strokeWidth={1.75}
                              className="text-app-fg shrink-0"
                            />
                            <input
                              autoFocus
                              value={editingName}
                              onChange={(event) => setEditingName(event.target.value)}
                              onBlur={() => saveRename(passkey)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") saveRename(passkey);
                                if (event.key === "Escape") setEditingId(null);
                              }}
                              placeholder="Passkey name"
                              className="bg-app-surface text-app-fg placeholder:text-app-muted-2 focus:border-[#2783de] h-8 w-full rounded-md border border-transparent px-2.5 text-sm outline-none transition-colors"
                            />
                          </div>
                        ) : (
                          <PasskeyRow
                            key={passkey.id}
                            passkey={passkey}
                            menuOpen={menuFor === passkey.id}
                            onMenu={() => setMenuFor(menuFor === passkey.id ? null : passkey.id)}
                            onRename={() => {
                              setMenuFor(null);
                              setEditingName(passkey.name ?? "");
                              setEditingId(passkey.id);
                            }}
                            onDelete={() => remove(passkey)}
                          />
                        ),
                      )}
                    </div>
                  </>
                ) : null}

                {error ? <p className="mt-3 text-[13px] text-[#e56458]">{error}</p> : null}

                <button type="button" onClick={add} disabled={busy} className={`${blueButton} mt-5`}>
                  {busy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={16} strokeWidth={2} />
                  )}
                  Add passkey
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="border-app-border text-app-fg hover:bg-app-hover mt-2 flex h-9 w-full items-center justify-center rounded-md border text-sm font-medium transition-colors"
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
