"use client";

import { Check, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { sendProjectRequest, type SendRequestState } from "@/app/(app)/inbox/actions";

type ViewerProject = {
  id: string;
  name: string;
};

type PartnerRequestDialogProps = {
  toUserId: string;
  toName: string;
  sharedSkills: string[];
  sharedInterests: string[];
  projects: ViewerProject[];
  fixedProject?: ViewerProject;
  triggerLabel?: string;
};

const initialState: SendRequestState = {
  sent: false,
  error: null,
};

export function PartnerRequestDialog({
  toUserId,
  toName,
  sharedSkills,
  sharedInterests,
  projects,
  fixedProject,
  triggerLabel = "Invite to build",
}: PartnerRequestDialogProps) {
  const [state, formAction, isPending] = useActionState(sendProjectRequest, initialState);
  const [open, setOpen] = useState(false);
  const sharedTags = [...sharedSkills, ...sharedInterests];
  const projectOptions = fixedProject ? [fixedProject] : projects;

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
      <span className="border-app-ink text-app-ink inline-flex h-9 items-center gap-2 rounded-full border px-5 text-sm font-medium">
        <Check size={16} strokeWidth={2.5} />
        Invite sent
      </span>
    );
  }

  if (!projectOptions.length) {
    return (
      <span className="text-app-meta text-sm">Create an active project to invite someone</span>
    );
  }

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
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-request-title"
            className="border-app-divider bg-app-paper text-app-ink w-full max-w-lg border shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="border-app-divider flex items-start justify-between gap-4 border-b p-6">
              <div>
                <p className="text-app-label text-[11px] font-semibold tracking-[0.24em] uppercase">
                  Build invite
                </p>
                <h3 id="partner-request-title" className="mt-2 font-serif text-3xl leading-tight font-light">
                  Invite {toName}
                  {fixedProject ? ` to ${fixedProject.name}` : " onto a project"}
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
              <input type="hidden" name="toUserId" value={toUserId} />
              <input type="hidden" name="kind" value="INVITE" />

              {sharedTags.length ? (
                <div>
                  <p className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                    Common ground
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sharedTags.slice(0, 8).map((tag) => (
                      <span
                        key={tag}
                        className="border-app-ink bg-app-ink text-app-paper border px-2 py-0.5 text-[11px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {fixedProject ? (
                <input type="hidden" name="projectId" value={fixedProject.id} />
              ) : (
                <div className="grid gap-2">
                  <label htmlFor="projectId" className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                    Project
                  </label>
                  <select
                    id="projectId"
                    name="projectId"
                    required
                    defaultValue={projectOptions[0]?.id ?? ""}
                    className="border-app-divider bg-app-wash text-app-ink focus:border-app-ink border px-3 py-3 text-sm outline-none transition-colors"
                  >
                    {projectOptions.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-2">
                <label htmlFor="message" className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  maxLength={1000}
                  required
                  placeholder={`Hi ${toName}, I think you'd be the missing piece on this build...`}
                  className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink resize-none border px-3 py-3 text-sm leading-6 outline-none transition-colors"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="note" className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                  Role you need (optional)
                </label>
                <input
                  id="note"
                  name="note"
                  maxLength={200}
                  placeholder="Frontend, infra, design systems..."
                  className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink border px-3 py-3 text-sm outline-none transition-colors"
                />
              </div>

              {state.error ? (
                <p className="border-app-divider bg-app-wash text-app-ink border p-3 text-sm">{state.error}</p>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="border-app-divider text-app-label hover:border-app-ink hover:text-app-ink inline-flex h-9 items-center rounded-full border px-5 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center rounded-full px-6 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isPending ? "Sending..." : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
