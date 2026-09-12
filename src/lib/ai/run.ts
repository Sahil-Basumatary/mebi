import "server-only";

import { randomBytes } from "node:crypto";
import type { AiCapability } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { classifyIntegrity, INTEGRITY_SYSTEM } from "@/lib/ai/integrity";
import { refundAiCredits, reserveAiCredits, settleAiCredits } from "@/lib/ai/metering";
import { completeWithRouter } from "@/lib/ai/provider";
import { entitlementsBlocked, loadEntitlements, resolveCapabilityForAction } from "@/lib/entitlements";
import { ACTION_CONTEXT_CHARS, type AiActionName } from "@/lib/ai/quota";
import { redactSecrets } from "@/lib/ai/redact";

export type AiRunResult = {
  ok: boolean;
  error: string | null;
  text: string | null;
  requestId: string;
};

export async function runProjectAi(input: {
  userId: string;
  action: AiActionName;
  userPrompt: string;
  requireConsent: boolean;
}): Promise<AiRunResult> {
  const requestId = randomBytes(16).toString("hex");
  const integrity = classifyIntegrity(input.userPrompt);
  if (integrity.refuse) {
    return { ok: false, error: integrity.reason, text: null, requestId };
  }

  const snapshot = await loadEntitlements(input.userId);
  if (!snapshot) {
    return { ok: false, error: "Account not found.", text: null, requestId };
  }
  const blocked = entitlementsBlocked(snapshot);
  if (blocked) {
    return { ok: false, error: blocked, text: null, requestId };
  }
  if (input.requireConsent && !snapshot.aiConsentAt) {
    return {
      ok: false,
      error: "Confirm AI consent in Settings before sending private repository content.",
      text: null,
      requestId,
    };
  }

  const capability = resolveCapabilityForAction(snapshot, input.action);
  try {
    await reserveAiCredits({
      userId: input.userId,
      requestId,
      action: input.action,
      capability: capability as AiCapability,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI allowance exceeded.";
    return { ok: false, error: message, text: null, requestId };
  }

  const started = Date.now();
  try {
    const result = await completeWithRouter({
      capability,
      plan: snapshot.plan,
      messages: [
        { role: "system", content: INTEGRITY_SYSTEM },
        {
          role: "user",
          content: redactSecrets(input.userPrompt).text.slice(
            0,
            ACTION_CONTEXT_CHARS[input.action] + 8_000,
          ),
        },
      ],
    });
    await settleAiCredits({
      requestId,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      model: result.model,
      latencyMs: Date.now() - started,
    });
    return { ok: true, error: null, text: result.text, requestId };
  } catch {
    await refundAiCredits(requestId);
    return { ok: false, error: "The model could not answer just now. Try again.", text: null, requestId };
  }
}

export async function gatherRepoContext(input: {
  repositoryId: string;
  userId: string;
  extra?: string;
}): Promise<string> {
  const [architecture, files, mistakes] = await Promise.all([
    prisma.repoArchitecture.findUnique({ where: { repositoryId: input.repositoryId } }),
    prisma.repoFileIndex.findMany({
      where: { repositoryId: input.repositoryId, role: { in: ["source", "config", "docs", "test"] } },
      orderBy: { path: "asc" },
      take: 60,
      select: { path: true, role: true, language: true, summary: true },
    }),
    prisma.learningMistake.findMany({
      where: { userId: input.userId },
      orderBy: { lastSeenAt: "desc" },
      take: 12,
      select: { category: true, detail: true, count: true },
    }),
  ]);
  const map = architecture
    ? `Summary: ${architecture.summary}\nLanguages: ${JSON.stringify(architecture.languages)}\nDependencies: ${JSON.stringify(architecture.dependencies)}\nModules: ${JSON.stringify(architecture.modules)}`
    : "No architecture map yet.";
  const fileList = files
    .map((file) => `${file.path} [${file.role}/${file.language ?? "unknown"}] ${file.summary ?? ""}`)
    .join("\n");
  const mistakeList = mistakes
    .map((row) => `${row.category} x${row.count}: ${row.detail}`)
    .join("\n");
  return [map, fileList, input.extra, mistakeList].filter(Boolean).join("\n\n").slice(0, ACTION_CONTEXT_CHARS.ARCHITECTURE);
}

export async function recordLearningSignal(userId: string, category: string, detail: string) {
  await prisma.learningMistake.upsert({
    where: { userId_category: { userId, category } },
    create: { userId, category, detail: detail.slice(0, 400) },
    update: {
      count: { increment: 1 },
      lastSeenAt: new Date(),
      detail: detail.slice(0, 400),
    },
  });
}
