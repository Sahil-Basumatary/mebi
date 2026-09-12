import { inngest } from "@/inngest/client";
import { indexRepository } from "@/lib/github/index-repo";

function logDeadLetter(fn: string, error: { name?: string }) {
  console.error("inngest_dead_letter", { fn, name: error.name ?? "Error" });
}

type RepoJobData = {
  repositoryId?: string;
  changedPaths?: unknown;
  removedPaths?: unknown;
};

export const syncRepository = inngest.createFunction(
  {
    id: "repo-sync",
    retries: 3,
    concurrency: { limit: 1, key: "event.data.repositoryId" },
    throttle: { limit: 4, period: "1m" },
    triggers: [{ event: "repo/sync.requested" }],
    onFailure: async ({ error }) => {
      logDeadLetter("repo-sync", error);
    },
  },
  async ({ event, step }) => {
    const data = event.data as RepoJobData;
    const repositoryId = String(data.repositoryId ?? "");
    if (!repositoryId) return { indexed: 0 };
    return step.run("index-repository", () => indexRepository(repositoryId));
  },
);

export const refreshRepositoryPush = inngest.createFunction(
  {
    id: "repo-push",
    retries: 3,
    concurrency: { limit: 1, key: "event.data.repositoryId" },
    throttle: { limit: 8, period: "1m" },
    triggers: [{ event: "repo/push.received" }],
    onFailure: async ({ error }) => {
      logDeadLetter("repo-push", error);
    },
  },
  async ({ event, step }) => {
    const data = event.data as RepoJobData;
    const repositoryId = String(data.repositoryId ?? "");
    if (!repositoryId) return { indexed: 0 };
    const changedPaths = Array.isArray(data.changedPaths)
      ? data.changedPaths.filter((item): item is string => typeof item === "string")
      : undefined;
    const removedPaths = Array.isArray(data.removedPaths)
      ? data.removedPaths.filter((item): item is string => typeof item === "string")
      : undefined;
    return step.run("index-changed-paths", () =>
      indexRepository(repositoryId, changedPaths, removedPaths),
    );
  },
);

export const inngestFunctions = [syncRepository, refreshRepositoryPush];
