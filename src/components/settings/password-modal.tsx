"use client";

import { useUser } from "@clerk/nextjs";
import { Loader2, RectangleEllipsis, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const outlineButton =
  "border-app-border text-app-fg hover:bg-app-hover flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-sm font-medium transition-colors";
const fieldInput =
  "bg-app-surface text-app-fg placeholder:text-app-muted-2 h-8 w-full rounded-md border border-transparent px-2.5 text-sm outline-none transition-colors focus:border-[#2783de]";

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "errors" in error) {
    const list = (error as { errors?: { message?: string }[] }).errors;
    if (list?.[0]?.message) return list[0].message;
  }
  return "Something went wrong. Please try again.";
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="text-app-muted block text-[12px] leading-4">{label}</label>
      <input
        type="password"
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${fieldInput} mt-1`}
      />
    </div>
  );
}

export function ChangePasswordControl() {
  const { user, isLoaded } = useUser();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPassword = isLoaded && user ? user.passwordEnabled : true;

  const cancel = useCallback(() => {
    setBusy((current) => {
      if (current) return current;
      setOpen(false);
      setCurrent("");
      setNext("");
      setConfirm("");
      setError(null);
      return current;
    });
  }, []);

  // Escape closes only this modal, not the settings modal behind it.
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

  const canSubmit =
    Boolean(next) && Boolean(confirm) && (!hasPassword || Boolean(current)) && !busy;

  async function submit() {
    if (!canSubmit || !user) return;
    if (next !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await user.updatePassword({
        newPassword: next,
        ...(hasPassword ? { currentPassword: current } : {}),
        // Rotate other sessions on password change — standard security hygiene.
        signOutOfOtherSessions: true,
      });
      cancel();
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={outlineButton}>
        Change password
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
                aria-label="Change password"
                className="border-app-border bg-app-canvas relative z-10 w-[350px] max-w-[92vw] rounded-xl border p-6 shadow-[0_24px_48px_rgba(25,25,25,0.24),0_4px_12px_rgba(25,25,25,0.14)]"
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
                  <RectangleEllipsis
                    size={20}
                    strokeWidth={1.75}
                    className="text-app-muted-2"
                  />
                  <h2 className="text-app-fg mt-2 text-[17px] leading-[22px] font-semibold">
                    Change password
                  </h2>
                  <p className="text-app-muted mt-2 text-[14px] leading-5">
                    Use a password at least 8 characters long, with a mix of letters and numbers.
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  {hasPassword ? (
                    <Field
                      label="Enter your current password"
                      value={current}
                      onChange={setCurrent}
                      placeholder="Current password"
                      autoFocus
                    />
                  ) : null}
                  <Field
                    label="Enter a new password"
                    value={next}
                    onChange={setNext}
                    placeholder="New password"
                    autoFocus={!hasPassword}
                  />
                  <Field
                    label="Confirm your new password"
                    value={confirm}
                    onChange={setConfirm}
                    placeholder="Confirm password"
                  />
                </div>

                {error ? <p className="mt-3 text-[13px] text-[#e56458]">{error}</p> : null}

                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit}
                  className="mt-5 flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-[#2783de] text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                  Change password
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
