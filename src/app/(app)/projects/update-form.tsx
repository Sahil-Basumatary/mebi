"use client";

import { useActionState, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
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
    <form action={formAction} className="border-app-divider bg-app-paper border">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="border-app-divider flex items-center justify-between gap-4 border-b px-4 py-3">
        <div>
          <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
            New activity
          </p>
          <h2 className="text-app-ink mt-1 text-lg font-semibold">Post an update</h2>
        </div>
        {disabled ? <span className="text-app-meta text-xs">Project completed</span> : null}
      </div>
      <div className="p-4">
        <label htmlFor="build-log-body" className="sr-only">
          Update
        </label>
        <textarea
          id="build-log-body"
          name="body"
          rows={3}
          maxLength={2000}
          required
          disabled={disabled || isPending}
          placeholder="What changed?"
          className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink w-full resize-none border px-3 py-3 text-sm leading-6 transition-colors outline-none disabled:opacity-50"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="text-app-body flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeProgress}
              disabled={disabled || isPending}
              onChange={(event) => setIncludeProgress(event.target.checked)}
              className="accent-app-ink"
            />
            Update progress
          </label>
          <AppButton type="submit" disabled={disabled || isPending}>
            {isPending ? "Posting..." : "Post update"}
          </AppButton>
        </div>
        {includeProgress ? (
          <div className="border-app-divider mt-4 border-t pt-4">
            <input type="hidden" name="progress" value={value} />
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="build-log-progress" className="text-app-label text-sm font-medium">
                Progress
              </label>
              <span className="text-app-ink text-lg font-semibold tabular-nums" aria-live="polite">
                {value}%
              </span>
            </div>
            <input
              id="build-log-progress"
              type="range"
              min={progress}
              max="100"
              step="5"
              value={value}
              disabled={disabled || isPending}
              onChange={(event) => setValue(Number(event.target.value))}
              className="accent-app-ink mt-3 w-full"
            />
            <div className="bg-app-divider mt-2 h-1.5" aria-hidden>
              <div className="bg-app-ink h-full" style={{ width: `${value}%` }} />
            </div>
          </div>
        ) : null}
        {state.error ? (
          <p role="alert" className="text-app-ink mt-3 text-sm">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
