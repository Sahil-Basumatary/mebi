"use client";

import { useActionState, useState, useTransition } from "react";
import { AppButton } from "@/components/ui/app-button";
import { Chip, EmptyState } from "@/components/layout";
import {
  draftProjectDocument,
  generateArchitectureMap,
  linkGithubRepository,
  loadRecentProjectCommits,
  requestProjectHint,
  requestRepoSync,
  reviewProjectCommit,
  unlinkGithubRepository,
  type AiActionState,
} from "./ai-actions";

export type LinkedRepoView = {
  id: string;
  owner: string;
  name: string;
  private: boolean;
  defaultBranch: string;
  lastSyncedAt: string | null;
  summary: string | null;
  languages: Record<string, number>;
  modules: Array<{ path: string; role: string; language: string | null }>;
};

export type LinkableRepoView = {
  id: string;
  owner: string;
  name: string;
  private: boolean;
};

type ProjectAiPanelProps = {
  projectId: string;
  linked: LinkedRepoView | null;
  linkable: LinkableRepoView[];
  reviews: Array<{ id: string; sha: string; title: string; createdAt: string }>;
  hints: Array<{ id: string; prompt: string; ladderStep: number; createdAt: string; response: string }>;
  drafts: Array<{ id: string; kind: string; title: string; body: string; createdAt: string }>;
};

const initial: AiActionState = { error: null, text: null };

function ActionNote({ state }: { state: AiActionState }) {
  if (state.error) {
    return <p className="text-app-signal text-sm">{state.error}</p>;
  }
  if (state.text) {
    return (
      <div className="border-app-divider bg-app-wash mt-3 max-h-80 overflow-auto border p-3">
        <pre className="text-app-body whitespace-pre-wrap font-sans text-sm leading-6">{state.text}</pre>
      </div>
    );
  }
  return null;
}

function downloadMarkdown(filename: string, body: string) {
  const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProjectAiPanel({
  projectId,
  linked,
  linkable,
  reviews,
  hints,
  drafts,
}: ProjectAiPanelProps) {
  const [linkState, linkAction, linkPending] = useActionState(linkGithubRepository, initial);
  const [unlinkState, unlinkAction, unlinkPending] = useActionState(unlinkGithubRepository, initial);
  const [syncState, syncAction, syncPending] = useActionState(requestRepoSync, initial);
  const [mapState, mapAction, mapPending] = useActionState(generateArchitectureMap, initial);
  const [reviewState, reviewAction, reviewPending] = useActionState(reviewProjectCommit, initial);
  const [hintState, hintAction, hintPending] = useActionState(requestProjectHint, initial);
  const [docsState, docsAction, docsPending] = useActionState(draftProjectDocument, initial);
  const [commits, setCommits] = useState<Array<{ sha: string; message: string }>>([]);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [loadingCommits, startCommitLoad] = useTransition();

  function copyText(text: string) {
    void navigator.clipboard.writeText(text);
  }

  return (
    <section id="hackollab-ai" className="border-app-divider bg-app-paper scroll-mt-20 border">
      <div className="border-app-divider border-b px-4 py-3">
        <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
          Hackollab AI
        </p>
        <h2 className="text-app-ink mt-1 text-lg font-semibold">Repository workspace</h2>
        <p className="text-app-body mt-1 text-sm leading-6">
          Read-only GitHub access. Hints, reviews, and drafts stay in Hackollab — nothing is pushed
          back to GitHub.
        </p>
      </div>

      <div className="space-y-6 p-4">
        <div className="space-y-3">
          {linked ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-app-ink text-sm font-medium">
                  {linked.owner}/{linked.name}
                </p>
                <Chip>{linked.private ? "private" : "public"}</Chip>
                <Chip>{linked.defaultBranch}</Chip>
                {linked.lastSyncedAt ? (
                  <span className="text-app-meta text-xs">
                    Indexed {new Date(linked.lastSyncedAt).toLocaleString("en-GB")}
                  </span>
                ) : (
                  <span className="text-app-meta text-xs">Indexing…</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={syncAction}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <AppButton type="submit" variant="secondary" size="sm" disabled={syncPending}>
                    {syncPending ? "Queuing…" : "Refresh index"}
                  </AppButton>
                </form>
                <form action={unlinkAction}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <AppButton type="submit" variant="ghost" size="sm" disabled={unlinkPending}>
                    Unlink
                  </AppButton>
                </form>
              </div>
              <ActionNote state={syncState.error || syncState.text ? syncState : unlinkState} />
            </>
          ) : linkable.length ? (
            <form action={linkAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="projectId" value={projectId} />
              <label className="grid min-w-56 flex-1 gap-1">
                <span className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                  Link a connected repository
                </span>
                <select
                  name="repositoryId"
                  required
                  className="border-app-divider bg-app-wash text-app-ink h-9 border px-2 text-sm outline-none"
                >
                  {linkable.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.owner}/{repo.name}
                      {repo.private ? " (private)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <AppButton type="submit" size="sm" disabled={linkPending}>
                {linkPending ? "Linking…" : "Link repository"}
              </AppButton>
            </form>
          ) : (
            <EmptyState
              variant="inline"
              eyebrow="GitHub"
              title="Install the Hackollab GitHub App in Settings → Connections, then link a repository here."
            />
          )}
          <ActionNote state={linkState} />
        </div>

        {linked ? (
          <>
            <div className="space-y-3">
              <h3 className="text-app-ink text-sm font-semibold">Architecture map</h3>
              {Object.keys(linked.languages).length ? (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(linked.languages).map(([language, count]) => (
                    <Chip key={language}>
                      {language} · {count}
                    </Chip>
                  ))}
                </div>
              ) : null}
              {linked.modules.length ? (
                <ul className="text-app-body max-h-40 overflow-auto text-sm leading-6">
                  {linked.modules.slice(0, 24).map((module) => (
                    <li key={module.path}>
                      <span className="text-app-ink font-medium">{module.path}</span>
                      <span className="text-app-meta"> · {module.role}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-app-meta text-sm">No file map yet. Refresh the index first.</p>
              )}
              {linked.summary ? (
                <p className="text-app-body whitespace-pre-wrap text-sm leading-6">{linked.summary}</p>
              ) : null}
              <form action={mapAction}>
                <input type="hidden" name="projectId" value={projectId} />
                <AppButton type="submit" size="sm" disabled={mapPending}>
                  {mapPending ? "Explaining…" : "Explain architecture"}
                </AppButton>
              </form>
              <ActionNote state={mapState} />
            </div>

            <div className="space-y-3">
              <h3 className="text-app-ink text-sm font-semibold">Commit review</h3>
              <p className="text-app-meta text-sm">
                Reviews run only when you ask. Free commits are not auto-scanned.
              </p>
              <form action={reviewAction} className="space-y-2">
                <input type="hidden" name="projectId" value={projectId} />
                <label className="grid gap-1">
                  <span className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                    Commit SHA
                  </span>
                  <input
                    name="sha"
                    list="recent-commits"
                    placeholder="Leave blank for the latest commit"
                    className="border-app-divider bg-app-wash text-app-ink h-9 border px-3 text-sm outline-none"
                  />
                  <datalist id="recent-commits">
                    {commits.map((commit) => (
                      <option key={commit.sha} value={commit.sha}>
                        {commit.message}
                      </option>
                    ))}
                  </datalist>
                </label>
                <div className="flex flex-wrap gap-2">
                  <AppButton type="submit" size="sm" disabled={reviewPending}>
                    {reviewPending ? "Reviewing…" : "Review commit"}
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={loadingCommits}
                    onClick={() => {
                      setCommitError(null);
                      startCommitLoad(async () => {
                        const result = await loadRecentProjectCommits(projectId);
                        if (result.error) {
                          setCommitError(result.error);
                          return;
                        }
                        setCommits(result.commits);
                      });
                    }}
                  >
                    {loadingCommits ? "Loading…" : "Load recent SHAs"}
                  </AppButton>
                </div>
                {commitError ? <p className="text-app-signal text-sm">{commitError}</p> : null}
              </form>
              <ActionNote state={reviewState} />
              {reviews.length ? (
                <ul className="text-app-meta space-y-1 text-sm">
                  {reviews.map((review) => (
                    <li key={review.id}>
                      {review.sha.slice(0, 8)} · {review.title}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="space-y-3">
              <h3 className="text-app-ink text-sm font-semibold">Hint ladder</h3>
              <form action={hintAction} className="space-y-2">
                <input type="hidden" name="projectId" value={projectId} />
                <textarea
                  name="question"
                  rows={3}
                  required
                  minLength={8}
                  maxLength={2000}
                  placeholder="What are you stuck on?"
                  className="border-app-divider bg-app-wash text-app-ink w-full border px-3 py-2 text-sm leading-6 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  <AppButton type="submit" size="sm" disabled={hintPending}>
                    {hintPending ? "Thinking…" : "Ask for a hint"}
                  </AppButton>
                  <AppButton
                    type="submit"
                    name="stronger"
                    value="1"
                    variant="secondary"
                    size="sm"
                    disabled={hintPending}
                  >
                    Stronger hint
                  </AppButton>
                </div>
              </form>
              <ActionNote state={hintState} />
              {hints.length ? (
                <ul className="space-y-2">
                  {hints.slice(0, 4).map((hint) => (
                    <li key={hint.id} className="border-app-divider border p-3">
                      <p className="text-app-ink text-sm font-medium">
                        Step {hint.ladderStep} · {hint.prompt}
                      </p>
                      <p className="text-app-body mt-1 line-clamp-4 text-sm leading-6">{hint.response}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="space-y-3">
              <h3 className="text-app-ink text-sm font-semibold">Documentation drafts</h3>
              <form action={docsAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="projectId" value={projectId} />
                <label className="grid gap-1">
                  <span className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                    Kind
                  </span>
                  <select
                    name="kind"
                    className="border-app-divider bg-app-wash text-app-ink h-9 border px-2 text-sm outline-none"
                  >
                    <option value="README">README</option>
                    <option value="ADR">ADR</option>
                    <option value="ARCHITECTURE">Architecture note</option>
                  </select>
                </label>
                <AppButton type="submit" size="sm" disabled={docsPending}>
                  {docsPending ? "Drafting…" : "Draft for copy"}
                </AppButton>
              </form>
              <ActionNote state={docsState} />
              {docsState.text ? (
                <div className="flex flex-wrap gap-2">
                  <AppButton type="button" variant="secondary" size="sm" onClick={() => copyText(docsState.text ?? "")}>
                    Copy
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadMarkdown("hackollab-draft.md", docsState.text ?? "")}
                  >
                    Download
                  </AppButton>
                </div>
              ) : null}
              {drafts.map((draft) => (
                <div key={draft.id} className="border-app-divider border p-3">
                  <p className="text-app-ink text-sm font-medium">{draft.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <AppButton type="button" variant="ghost" size="sm" onClick={() => copyText(draft.body)}>
                      Copy
                    </AppButton>
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadMarkdown(`${draft.kind.toLowerCase()}.md`, draft.body)}
                    >
                      Download
                    </AppButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
