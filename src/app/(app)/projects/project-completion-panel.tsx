"use client";

import { useActionState, useEffect, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { useFocusTrap } from "@/hooks/use-focus-trap";
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
  const dialogRef = useFocusTrap(dialogOpen);

  useEffect(() => {
    if (state.completed) {
      const frame = requestAnimationFrame(() => {
        setDialogOpen(true);
      });
      fireConfetti();

      return () => cancelAnimationFrame(frame);
    }
  }, [state.completed]);

  useEffect(() => {
    if (!dialogOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDialogOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogOpen]);

  return (
    <div className="border-app-divider bg-app-chip border p-6">
      <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
        Finish line
      </p>
      <h2 className="mt-3 font-serif text-3xl font-light">Mark this build finished?</h2>
      <p className="text-app-body mt-3 text-[16px] leading-6">
        This locks progress at 100% and unlocks publishing.
      </p>
      <form action={formAction} className="mt-6">
        <input type="hidden" name="projectId" value={projectId} />
        <AppButton disabled={disabled || isPending}>
          {disabled ? "Project completed" : isPending ? "Completing..." : "Mark as complete"}
        </AppButton>
      </form>
      {state.error ? (
        <p role="alert" className="text-app-ink mt-4 text-sm">
          {state.error}
        </p>
      ) : null}

      {dialogOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-complete-title"
            className="border-app-divider bg-app-paper text-app-ink max-w-md border p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <p className="text-app-label text-[11px] font-semibold tracking-[0.24em] uppercase">
              Project finished
            </p>
            <h3
              id="project-complete-title"
              className="mt-4 font-serif text-4xl leading-tight font-light"
            >
              Project finished!
            </h3>
            <p className="text-app-body mt-4 text-[16px] leading-6">
              You can publish it from the project page.
            </p>
            <div className="mt-6 flex justify-end">
              <AppButton type="button" onClick={() => setDialogOpen(false)}>
                Continue
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
