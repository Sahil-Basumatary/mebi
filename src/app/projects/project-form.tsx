"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createProject, type ProjectFormState } from "./actions";

const initialState: ProjectFormState = {
  error: null,
};

export function ProjectForm() {
  const [state, formAction, isPending] = useActionState(createProject, initialState);

  return (
    <form action={formAction} className="grid gap-5 border border-[#d8d8d8] bg-[#ffffff] p-6">
      <div className="grid gap-2">
        <label htmlFor="name" className="text-[11px] font-semibold tracking-[0.2em] text-[#555555] uppercase">
          Project name
        </label>
        <input
          id="name"
          name="name"
          maxLength={120}
          required
          placeholder="KCL founder matching graph"
          className="border border-[#d8d8d8] bg-[#f7f7f7] px-3 py-3 text-sm text-[#000000] outline-none transition-colors placeholder:text-[#777777] focus:border-[#000000]"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="description" className="text-[11px] font-semibold tracking-[0.2em] text-[#555555] uppercase">
          Brief
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          maxLength={1200}
          required
          placeholder="What problem are you solving, who is it for, and what kind of partner would make it real?"
          className="resize-none border border-[#d8d8d8] bg-[#f7f7f7] px-3 py-3 text-sm leading-6 text-[#000000] outline-none transition-colors placeholder:text-[#777777] focus:border-[#000000]"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="techStack" className="text-[11px] font-semibold tracking-[0.2em] text-[#555555] uppercase">
            Tech stack
          </label>
          <input
            id="techStack"
            name="techStack"
            placeholder="Next.js, Prisma, Postgres"
            className="border border-[#d8d8d8] bg-[#f7f7f7] px-3 py-3 text-sm text-[#000000] outline-none transition-colors placeholder:text-[#777777] focus:border-[#000000]"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="estimatedTime" className="text-[11px] font-semibold tracking-[0.2em] text-[#555555] uppercase">
            Estimated time
          </label>
          <input
            id="estimatedTime"
            name="estimatedTime"
            maxLength={80}
            placeholder="4 weeks"
            className="border border-[#d8d8d8] bg-[#f7f7f7] px-3 py-3 text-sm text-[#000000] outline-none transition-colors placeholder:text-[#777777] focus:border-[#000000]"
          />
        </div>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-[11px] font-semibold tracking-[0.2em] text-[#555555] uppercase">
          Visibility
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 border border-[#d8d8d8] bg-[#f7f7f7] p-4 text-sm">
            <input type="radio" name="visibility" value="PUBLIC" defaultChecked className="mt-1 accent-[#000000]" />
            <span>
              <span className="block font-semibold">Public</span>
              <span className="mt-1 block text-[#555555]">Visible later in discovery and partner matching.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 border border-[#d8d8d8] bg-[#f7f7f7] p-4 text-sm">
            <input type="radio" name="visibility" value="PRIVATE" className="mt-1 accent-[#000000]" />
            <span>
              <span className="block font-semibold">Private</span>
              <span className="mt-1 block text-[#555555]">Keep it personal until the brief is ready.</span>
            </span>
          </label>
        </div>
      </fieldset>

      {state.error ? <p className="border border-[#d8d8d8] bg-[#f7f7f7] p-3 text-sm text-[#000000]">{state.error}</p> : null}

      <div className="flex justify-end">
        <Button disabled={isPending} className="rounded-full bg-[#000000] px-6 text-[#ffffff] hover:bg-[#333333]">
          {isPending ? "Creating..." : "Create project"}
        </Button>
      </div>
    </form>
  );
}
