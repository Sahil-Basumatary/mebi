import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyGithubSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;
  if (!signatureHeader.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided, "utf8"), Buffer.from(expected, "utf8"));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export type PushPathset = {
  changed: string[];
  removed: string[];
};

export function pathsFromPushPayload(payload: Record<string, unknown>): PushPathset {
  const commits = Array.isArray(payload.commits) ? payload.commits : [];
  const changed = new Set<string>();
  const removed = new Set<string>();
  for (const commit of commits) {
    if (!commit || typeof commit !== "object") continue;
    const row = commit as { added?: unknown; modified?: unknown; removed?: unknown };
    for (const path of asStringArray(row.added)) changed.add(path);
    for (const path of asStringArray(row.modified)) changed.add(path);
    for (const path of asStringArray(row.removed)) removed.add(path);
  }
  for (const path of removed) changed.delete(path);
  return { changed: [...changed], removed: [...removed] };
}

export function isDeletedRef(after: string | null): boolean {
  return Boolean(after && /^0+$/.test(after));
}
