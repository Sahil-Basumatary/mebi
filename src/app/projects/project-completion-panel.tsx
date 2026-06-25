"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { markProjectComplete, type CompleteProjectState } from "./actions";

type ProjectCompletionPanelProps = {
  projectId: string;
  disabled: boolean;
};

const initialState: CompleteProjectState = {
  completed: false,
  error: null,
};

function fireConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.className = "pointer-events-none fixed inset-0 z-[70] overflow-hidden";
  document.body.appendChild(container);

  const colors = ["#000000", "#555555", "#d8d8d8", "#ffffff"];

  for (let index = 0; index < 48; index += 1) {
    const piece = document.createElement("span");
    const size = 6 + Math.random() * 7;
    piece.style.position = "absolute";
    piece.style.left = `${45 + Math.random() * 10}%`;
    piece.style.top = "42%";
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 0.42}px`;
    piece.style.background = colors[index % colors.length];
    piece.style.border = "1px solid rgba(0,0,0,0.12)";
    container.appendChild(piece);

    piece.animate(
      [
        { transform: "translate3d(0, 0, 0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate3d(${(Math.random() - 0.5) * 720}px, ${240 + Math.random() * 260}px, 0) rotate(${240 + Math.random() * 420}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 1100 + Math.random() * 700,
        easing: "cubic-bezier(0.16,1,0.3,1)",
        fill: "forwards",
      },
    );
  }

  window.setTimeout(() => container.remove(), 2000);
}

export function ProjectCompletionPanel({ projectId, disabled }: ProjectCompletionPanelProps) {
  const [state, formAction, isPending] = useActionState(markProjectComplete, initialState);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (state.completed) {
      const frame = requestAnimationFrame(() => {
        setDialogOpen(true);
      });
      fireConfetti();

      return () => cancelAnimationFrame(frame);
    }
  }, [state.completed]);

  return (
    <div className="border border-[#d8d8d8] bg-[#f4f4f4] p-6">
      <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
        Finish line
      </p>
      <h2 className="mt-3 font-serif text-3xl font-light">Ready to close the loop?</h2>
      <p className="mt-3 text-sm leading-6 text-[#333333]">
        Completion locks the project at 100% and turns it into future proof for profile, partners,
        and CV generation.
      </p>
      <form action={formAction} className="mt-6">
        <input type="hidden" name="projectId" value={projectId} />
        <Button disabled={disabled || isPending} className="rounded-full bg-[#000000] px-6 text-[#ffffff] hover:bg-[#333333]">
          {disabled ? "Project completed" : isPending ? "Completing..." : "Mark as complete"}
        </Button>
      </form>
      {state.error ? <p className="mt-4 text-sm text-[#000000]">{state.error}</p> : null}

      {dialogOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#000000]/55 px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="project-complete-title" className="max-w-md border border-[#d8d8d8] bg-[#ffffff] p-8 text-[#000000] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
              Project finished
            </p>
            <h3 id="project-complete-title" className="mt-4 font-serif text-4xl leading-tight font-light">
              Project finished!
            </h3>
            <p className="mt-4 text-sm leading-6 text-[#333333]">
              Nice. This is now a completed build record. Next milestone can turn this into proof and
              partner-facing signal.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-full bg-[#000000] px-5 py-2 text-sm font-medium text-[#ffffff]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
