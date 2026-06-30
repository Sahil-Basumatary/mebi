"use client";

import { Check, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { sendPartnershipRequest, type SendRequestState } from "@/app/inbox/actions";

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
}: PartnerRequestDialogProps) {
  const [state, formAction, isPending] = useActionState(sendPartnershipRequest, initialState);
  const [open, setOpen] = useState(false);
  const sharedTags = [...sharedSkills, ...sharedInterests];

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Once the request lands, hold the success state and ease the dialog shut so the
  // tick animation has a beat to read before the surface disappears.
  useEffect(() => {
    if (!state.sent) return;
    const timer = window.setTimeout(() => setOpen(false), 1400);
    return () => window.clearTimeout(timer);
  }, [state.sent]);

  if (state.sent) {
    return (
      <span className="inline-flex h-9 items-center gap-2 rounded-full border border-[#000000] px-5 text-sm font-medium text-[#000000]">
        <Check size={16} strokeWidth={2.5} />
        Request sent
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-full bg-[#000000] px-5 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#333333]"
      >
        Request to partner
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#000000]/55 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-request-title"
            className="w-full max-w-lg border border-[#d8d8d8] bg-[#ffffff] text-[#000000] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#d8d8d8] p-6">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
                  Partnership request
                </p>
                <h3 id="partner-request-title" className="mt-2 font-serif text-3xl leading-tight font-light">
                  Reach out to {toName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full border border-[#d8d8d8] p-1.5 text-[#555555] transition-colors hover:border-[#000000] hover:text-[#000000]"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <form action={formAction} className="grid gap-5 p-6">
              <input type="hidden" name="toUserId" value={toUserId} />

              {sharedTags.length ? (
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-[#555555] uppercase">
                    Common ground
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sharedTags.slice(0, 8).map((tag) => (
                      <span
                        key={tag}
                        className="border border-[#000000] bg-[#000000] px-2 py-0.5 text-[11px] text-[#ffffff]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2">
                <label htmlFor="message" className="text-[11px] font-semibold tracking-[0.2em] text-[#555555] uppercase">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  maxLength={1000}
                  required
                  placeholder={`Hi ${toName}, I'm building something and your skills are exactly the missing piece...`}
                  className="resize-none border border-[#d8d8d8] bg-[#f7f7f7] px-3 py-3 text-sm leading-6 text-[#000000] outline-none transition-colors placeholder:text-[#777777] focus:border-[#000000]"
                />
              </div>

              {projects.length ? (
                <div className="grid gap-2">
                  <label htmlFor="relatedProjectId" className="text-[11px] font-semibold tracking-[0.2em] text-[#555555] uppercase">
                    Attach a project (optional)
                  </label>
                  <select
                    id="relatedProjectId"
                    name="relatedProjectId"
                    defaultValue=""
                    className="border border-[#d8d8d8] bg-[#f7f7f7] px-3 py-3 text-sm text-[#000000] outline-none transition-colors focus:border-[#000000]"
                  >
                    <option value="">No specific project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="grid gap-2">
                <label htmlFor="projectInterest" className="text-[11px] font-semibold tracking-[0.2em] text-[#555555] uppercase">
                  What would you build together? (optional)
                </label>
                <input
                  id="projectInterest"
                  name="projectInterest"
                  maxLength={200}
                  placeholder="A KCL hardware hack, a fintech side project..."
                  className="border border-[#d8d8d8] bg-[#f7f7f7] px-3 py-3 text-sm text-[#000000] outline-none transition-colors placeholder:text-[#777777] focus:border-[#000000]"
                />
              </div>

              {state.error ? (
                <p className="border border-[#d8d8d8] bg-[#f7f7f7] p-3 text-sm text-[#000000]">{state.error}</p>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 items-center rounded-full border border-[#d8d8d8] px-5 text-sm font-medium text-[#555555] transition-colors hover:border-[#000000] hover:text-[#000000]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-9 items-center rounded-full bg-[#000000] px-6 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#333333] disabled:opacity-50"
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
