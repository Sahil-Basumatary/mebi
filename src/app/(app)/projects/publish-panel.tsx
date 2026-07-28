"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  publishProject,
  unpublishProject,
  type PublishState,
} from "./actions";

type PublishPanelProps = {
  projectId: string;
  published: boolean;
  slug: string | null;
  summary: string | null;
  canPublish: boolean;
  blockReason: string | null;
};

const initialState: PublishState = {
  error: null,
  status: "idle",
  slug: null,
};

export function PublishPanel({
  projectId,
  published,
  slug,
  summary,
  canPublish,
  blockReason,
}: PublishPanelProps) {
  const [publishState, publishAction, publishing] = useActionState(
    publishProject,
    initialState,
  );
  const [unpublishState, unpublishAction, unpublishing] = useActionState(
    unpublishProject,
    initialState,
  );

  const isLive =
    publishState.status === "published"
      ? true
      : unpublishState.status === "unpublished"
        ? false
        : published;
  const liveSlug =
    (publishState.status === "published" ? publishState.slug : null) ??
    (unpublishState.status === "unpublished" ? unpublishState.slug : null) ??
    slug;
  const error = publishState.error ?? unpublishState.error;

  return (
    <section className="border-app-divider bg-app-paper border">
      <div className="border-app-divider border-b px-5 py-4">
        <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
          Publish
        </p>
        <p className="text-app-body mt-2 text-body-sm leading-5">
          Put a public proof page live once the build is finished and attested.
        </p>
      </div>

      <div className="space-y-4 px-5 py-5">
        {isLive && liveSlug ? (
          <>
            <p className="text-app-ink text-sm leading-6">
              Live at{" "}
              <Link
                href={`/b/${liveSlug}`}
                className="border-app-ink border-b pb-0.5 font-medium"
              >
                /b/{liveSlug}
              </Link>
            </p>
            <form action={unpublishAction}>
              <input type="hidden" name="projectId" value={projectId} />
              <button
                type="submit"
                disabled={unpublishing}
                className="border-app-divider text-app-ink hover:bg-app-wash inline-flex h-9 items-center rounded-full border px-5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {unpublishing ? "Unpublishing..." : "Unpublish"}
              </button>
            </form>
          </>
        ) : canPublish ? (
          <form action={publishAction} className="space-y-4">
            <input type="hidden" name="projectId" value={projectId} />
            <label className="block space-y-2">
              <span className="text-app-label text-[10px] font-semibold tracking-[0.16em] uppercase">
                Public summary
              </span>
              <textarea
                name="summary"
                rows={3}
                maxLength={280}
                defaultValue={summary ?? ""}
                placeholder="One short line about what you shipped."
                className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink w-full resize-none border px-3 py-3 text-sm leading-6 outline-none transition-colors"
              />
            </label>
            <button
              type="submit"
              disabled={publishing}
              className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {publishing ? "Publishing..." : "Publish proof"}
            </button>
          </form>
        ) : (
          <p className="text-app-body text-body-sm leading-6">
            {blockReason ?? "This build is not ready to publish yet."}
          </p>
        )}

        {error ? <p className="text-app-ink text-sm">{error}</p> : null}
      </div>
    </section>
  );
}
