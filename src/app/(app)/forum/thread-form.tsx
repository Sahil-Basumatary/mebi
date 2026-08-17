"use client";

import { useActionState, useState } from "react";
import { createThread, type ForumFormState } from "@/app/(app)/forum/actions";
import { BODY_MAX, MAX_TAGS, TITLE_MAX } from "@/lib/forum";

type ThreadFormProps = {
  boardSlug: string;
  projects: { id: string; name: string }[];
};

const initialState: ForumFormState = { error: null };

export function ThreadForm({ boardSlug, projects }: ThreadFormProps) {
  const [state, formAction, isPending] = useActionState(createThread, initialState);
  const [titleLen, setTitleLen] = useState(0);
  const [bodyLen, setBodyLen] = useState(0);

  return (
    <form
      action={formAction}
      className="border-app-divider bg-app-paper flex flex-col gap-5 border p-6"
    >
      <input type="hidden" name="boardSlug" value={boardSlug} />
      <div>
        <label
          htmlFor="forum-title"
          className="text-app-label text-[13px] font-semibold tracking-[0.16em] uppercase"
        >
          Title
        </label>
        <input
          id="forum-title"
          name="title"
          required
          minLength={8}
          maxLength={TITLE_MAX}
          disabled={isPending}
          onChange={(event) => setTitleLen(event.target.value.length)}
          placeholder="Thread title"
          className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink mt-3 w-full border px-3 py-3 text-base outline-none"
        />
        <p className="text-app-meta tracking-meta mt-2 font-mono text-xs">
          {titleLen}/{TITLE_MAX}
        </p>
      </div>
      <div>
        <label
          htmlFor="forum-body"
          className="text-app-label text-[13px] font-semibold tracking-[0.16em] uppercase"
        >
          Post
        </label>
        <textarea
          id="forum-body"
          name="body"
          required
          minLength={20}
          maxLength={BODY_MAX}
          rows={10}
          disabled={isPending}
          onChange={(event) => setBodyLen(event.target.value.length)}
          placeholder="Write your post"
          className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink mt-3 w-full resize-y border px-3 py-3 text-base leading-7 outline-none"
        />
        <p className="text-app-meta tracking-meta mt-2 font-mono text-xs">
          {bodyLen}/{BODY_MAX}
        </p>
      </div>
      <div>
        <label
          htmlFor="forum-tags"
          className="text-app-label text-[13px] font-semibold tracking-[0.16em] uppercase"
        >
          Tags
        </label>
        <input
          id="forum-tags"
          name="tags"
          maxLength={200}
          disabled={isPending}
          placeholder="react, postgres, lft"
          className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink mt-3 w-full border px-3 py-3 text-base outline-none"
        />
        <p className="text-app-meta mt-2 text-xs">
          Up to {MAX_TAGS} tags, comma-separated. Optional.
        </p>
      </div>
      {projects.length ? (
        <div>
          <label
            htmlFor="forum-project"
            className="text-app-label text-[13px] font-semibold tracking-[0.16em] uppercase"
          >
            Attach a build
          </label>
          <select
            id="forum-project"
            name="projectId"
            disabled={isPending}
            defaultValue=""
            className="border-app-divider bg-app-wash text-app-ink focus:border-app-ink mt-3 h-11 w-full border px-3 text-base outline-none"
          >
            <option value="">No attached build</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-app-ink text-sm">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="bg-forum-red inline-flex h-9 items-center px-5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Posting..." : "Post thread"}
        </button>
      </div>
    </form>
  );
}
