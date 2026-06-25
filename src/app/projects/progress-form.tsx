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
    <form action={formAction} className="border border-[#d8d8d8] bg-[#ffffff] p-6">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
            Progress
          </p>
          <p className="mt-2 text-sm leading-6 text-[#333333]">Move the project only when real work has shipped.</p>
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
        className="mt-6 w-full accent-[#000000]"
      />
      <div className="mt-3 h-2 bg-[#d8d8d8]">
        <div className="h-full bg-[#000000]" style={{ width: `${value}%` }} />
      </div>
      {state.error ? <p className="mt-4 text-sm text-[#000000]">{state.error}</p> : null}
      <div className="mt-5 flex justify-end">
        <Button disabled={disabled || isPending} className="rounded-full bg-[#000000] px-6 text-[#ffffff] hover:bg-[#333333]">
          {isPending ? "Saving..." : "Save progress"}
        </Button>
      </div>
    </form>
  );
}
