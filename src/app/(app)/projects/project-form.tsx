"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createProject, type ProjectFormState } from "./actions";
import { useBriefReport } from "./brief-signal";

const initialState: ProjectFormState = {
  error: null,
};

export function ProjectForm() {
  const [state, formAction, isPending] = useActionState(createProject, initialState);
  const report = useBriefReport();

  return (
    <form action={formAction} className="border-app-divider bg-app-paper grid gap-5 border p-6">
      <div className="grid gap-2">
        <label htmlFor="name" className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
          Project name
        </label>
        <input
          id="name"
          name="name"
          maxLength={120}
          required
          onChange={(event) => report("name", event.target.value)}
          placeholder="KCL founder matching graph"
          className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink border px-3 py-3 text-sm outline-none transition-colors"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="description" className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
          Brief
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          maxLength={1200}
          required
          onChange={(event) => report("description", event.target.value)}
          placeholder="What problem are you solving, who is it for, and what kind of partner would make it real?"
          className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink resize-none border px-3 py-3 text-sm leading-6 outline-none transition-colors"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="techStack" className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
            Tech stack
          </label>
          <input
            id="techStack"
            name="techStack"
            onChange={(event) => report("techStack", event.target.value)}
            placeholder="Next.js, Prisma, Postgres"
            className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink border px-3 py-3 text-sm outline-none transition-colors"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="estimatedTime" className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
            Estimated time
          </label>
          <input
            id="estimatedTime"
            name="estimatedTime"
            maxLength={80}
            onChange={(event) => report("estimatedTime", event.target.value)}
            placeholder="4 weeks"
            className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink border px-3 py-3 text-sm outline-none transition-colors"
          />
        </div>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
          Visibility
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="border-app-divider bg-app-wash flex cursor-pointer items-start gap-3 border p-4 text-sm">
            <input type="radio" name="visibility" value="PUBLIC" defaultChecked className="accent-app-ink mt-1" />
            <span>
              <span className="block font-semibold">Public</span>
              <span className="text-app-label mt-1 block">
                Shows on Discover so partners can ask to join.
              </span>
            </span>
          </label>
          <label className="border-app-divider bg-app-wash flex cursor-pointer items-start gap-3 border p-4 text-sm">
            <input type="radio" name="visibility" value="PRIVATE" className="accent-app-ink mt-1" />
            <span>
              <span className="block font-semibold">Private</span>
              <span className="text-app-label mt-1 block">Keep it personal until the brief is ready.</span>
            </span>
          </label>
        </div>
      </fieldset>

      {state.error ? <p className="border-app-divider bg-app-wash text-app-ink border p-3 text-sm">{state.error}</p> : null}

      <div className="flex justify-end">
        <Button disabled={isPending} className="bg-app-ink text-app-paper hover:bg-app-accent-hover rounded-full px-6">
          {isPending ? "Creating..." : "Create project"}
        </Button>
      </div>
    </form>
  );
}
