"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { postProjectUpdate, type ProjectFormState } from "./actions";

type UpdateFormProps = {
  projectId: string;
  progress: number;
  disabled: boolean;
};

const initialState: ProjectFormState = {
  error: null,
};

export function UpdateForm({ projectId, progress, disabled }: UpdateFormProps) {
  const [value, setValue] = useState(progress);
  const [includeProgress, setIncludeProgress] = useState(false);
  const [state, formAction, isPending] = useActionState(postProjectUpdate, initialState);

  return (
    <form action={formAction} className="border-app-divider bg-app-paper border p-6">
      <input type="hidden" name="projectId" value={projectId} />
      <div>
        <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
          Build log
        </p>
        <p className="text-app-body mt-2 text-[16px] leading-6">
          Post what you shipped. Progress only moves when you say it does.
        </p>
      </div>
      <textarea
        name="body"
        rows={4}
        maxLength={2000}
        required
        disabled={disabled || isPending}
        placeholder="Shipped the matching query, reviewed the brief with my partner..."
        className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink mt-5 w-full resize-none border px-3 py-3 text-sm leading-6 outline-none transition-colors disabled:opacity-50"
      />
      <label className="text-app-body mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeProgress}
          disabled={disabled || isPending}
          onChange={(event) => setIncludeProgress(event.target.checked)}
          className="accent-app-ink"
        />
        Also advance progress
      </label>
      {includeProgress ? (
        <>
          <input type="hidden" name="progress" value={value} />
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-app-label text-xs font-semibold tracking-[0.2em] uppercase">
              Progress
            </p>
            <span className="font-serif text-3xl font-light">{value}%</span>
          </div>
          <input
            type="range"
            min={progress}
            max="100"
            step="5"
            value={value}
            disabled={disabled || isPending}
            onChange={(event) => setValue(Number(event.target.value))}
            className="accent-app-ink mt-3 w-full"
          />
          <div className="bg-app-divider mt-3 h-2">
            <div className="bg-app-ink h-full" style={{ width: `${value}%` }} />
          </div>
        </>
      ) : null}
      {state.error ? <p className="text-app-ink mt-4 text-sm">{state.error}</p> : null}
      <div className="mt-5 flex justify-end">
        <Button
          disabled={disabled || isPending}
          className="bg-app-ink text-app-paper hover:bg-app-accent-hover rounded-full px-6"
        >
          {isPending ? "Posting..." : "Post update"}
        </Button>
      </div>
    </form>
  );
}
