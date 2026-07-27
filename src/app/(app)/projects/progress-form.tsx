"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateProjectProgress, type ProjectFormState } from "./actions";

type ProgressFormProps = {
  projectId: string;
  progress: number;
  disabled: boolean;
};

const initialState: ProjectFormState = {
  error: null,
};

export function ProgressForm({ projectId, progress, disabled }: ProgressFormProps) {
  const [value, setValue] = useState(progress);
  const [state, formAction, isPending] = useActionState(updateProjectProgress, initialState);

  return (
    <form action={formAction} className="border-app-divider bg-app-paper border p-6">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
            Progress
          </p>
          <p className="text-app-body mt-2 text-[16px] leading-6">Move the project only when real work has shipped.</p>
        </div>
        <span className="font-serif text-4xl font-light">{value}%</span>
      </div>
      <input
        name="progress"
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        disabled={disabled || isPending}
        onChange={(event) => setValue(Number(event.target.value))}
        className="accent-app-ink mt-6 w-full"
      />
      <div className="bg-app-divider mt-3 h-2">
        <div className="bg-app-ink h-full" style={{ width: `${value}%` }} />
      </div>
      {state.error ? <p className="text-app-ink mt-4 text-sm">{state.error}</p> : null}
      <div className="mt-5 flex justify-end">
        <Button disabled={disabled || isPending} className="bg-app-ink text-app-paper hover:bg-app-accent-hover rounded-full px-6">
          {isPending ? "Saving..." : "Save progress"}
        </Button>
      </div>
    </form>
  );
}
