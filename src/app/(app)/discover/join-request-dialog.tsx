"use client";

import { Check, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { sendProjectRequest, type SendRequestState } from "@/app/(app)/inbox/actions";
import { useFocusTrap } from "@/hooks/use-focus-trap";

type JoinTarget = {
  id: string;
  name: string;
};

type JoinRequestDialogProps = {
  projectId: string;
  projectName: string;
  members: JoinTarget[];
  triggerLabel?: string;
};

const initialState: SendRequestState = {
  sent: false,
  error: null,
};

export function JoinRequestDialog({
  projectId,
  projectName,
  members,
  triggerLabel = "Ask to join",
}: JoinRequestDialogProps) {
  const [state, formAction, isPending] = useActionState(sendProjectRequest, initialState);
  const [open, setOpen] = useState(false);
  const dialogRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!state.sent) return;
    const timer = window.setTimeout(() => setOpen(false), 1400);
    return () => window.clearTimeout(timer);
  }, [state.sent]);

  if (state.sent) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="border-app-ink text-app-ink inline-flex h-9 items-center gap-2 rounded-full border px-5 text-sm font-medium"
      >
        <Check size={16} strokeWidth={2.5} aria-hidden />
        Request sent
      </span>
    );
  }

  if (!members.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center rounded-full px-5 text-sm font-medium transition-colors"
      >
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-request-title"
            className="border-app-divider bg-app-paper text-app-ink w-full max-w-lg border shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="border-app-divider flex items-start justify-between gap-4 border-b p-6">
              <div>
                <p className="text-app-label text-[11px] font-semibold tracking-[0.24em] uppercase">
                  Join request
                </p>
                <h3
                  id="join-request-title"
                  className="mt-2 font-serif text-3xl leading-tight font-light"
                >
                  Ask to join {projectName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="border-app-divider text-app-label hover:border-app-ink hover:text-app-ink shrink-0 rounded-full border p-1.5 transition-colors"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <form action={formAction} className="grid gap-5 p-6">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="kind" value="JOIN" />

              <div className="grid gap-2">
                <label
                  htmlFor="toUserId"
                  className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase"
                >
                  Ask
                </label>
                <select
                  id="toUserId"
                  name="toUserId"
                  required
                  defaultValue={members[0]?.id ?? ""}
                  className="border-app-divider bg-app-wash text-app-ink focus:border-app-ink border px-3 py-3 text-sm outline-none"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="join-message"
                  className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase"
                >
                  Message
                </label>
                <textarea
                  id="join-message"
                  name="message"
                  rows={4}
                  maxLength={1000}
                  required
                  placeholder={`Hi, I want to help on ${projectName}...`}
                  className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink resize-none border px-3 py-3 text-sm leading-6 outline-none"
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="join-note"
                  className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase"
                >
                  What you bring (optional)
                </label>
                <input
                  id="join-note"
                  name="note"
                  maxLength={200}
                  placeholder="Frontend, infra, design systems..."
                  className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink border px-3 py-3 text-sm outline-none"
                />
              </div>

              {state.error ? (
                <p role="alert" className="border-app-divider bg-app-wash text-app-ink border p-3 text-sm">
                  {state.error}
                </p>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="border-app-divider text-app-label hover:border-app-ink hover:text-app-ink inline-flex h-9 items-center rounded-full border px-5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center rounded-full px-6 text-sm font-medium disabled:opacity-50"
                >
                  {isPending ? "Sending..." : "Send request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
