import "server-only";

import type { AiCapabilityName } from "@/lib/ai/quota";
import {
  isCircuitOpen,
  recordProviderFailure,
  recordProviderSuccess,
  type CircuitProvider,
} from "@/lib/ai/circuit";
import { fallbackRoute, routeModel, type ModelRoute } from "@/lib/ai/router";
import { estimateCostMicros } from "@/lib/ai/prices";
import { redactSecrets } from "@/lib/ai/redact";

export type ProviderMessage = {
  role: "system" | "user";
  content: string;
};

export type ProviderResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: ModelRoute["provider"];
};

const TIMEOUT_MS = 45_000;

function parseJsonSafe(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function logComplete(result: ProviderResult, latencyMs: number, capability: AiCapabilityName) {
  console.info("ai_complete", {
    provider: result.provider,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costMicros: estimateCostMicros({
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    }),
    latencyMs,
    capability,
  });
}

async function callOpenAi(model: string, messages: ProviderMessage[]): Promise<ProviderResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY is missing.");
  const response = await timedFetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1800,
      store: false,
      messages,
    }),
  });
  const json = parseJsonSafe(await response.text());
  if (!response.ok) throw new Error(`openai_${response.status}`);
  const text = (json?.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ?? "";
  const usage = json?.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
  return {
    text,
    inputTokens: usage?.prompt_tokens ?? 0,
    outputTokens: usage?.completion_tokens ?? 0,
    model,
    provider: "openai",
  };
}

async function callGemini(model: string, messages: ProviderMessage[]): Promise<ProviderResult> {
  const key = process.env.GOOGLE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GOOGLE_AI_API_KEY is missing.");
  const system = messages.filter((item) => item.role === "system").map((item) => item.content).join("\n");
  const user = messages.filter((item) => item.role === "user").map((item) => item.content).join("\n\n");
  const response = await timedFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1800 },
      }),
    },
  );
  const json = parseJsonSafe(await response.text());
  if (!response.ok) throw new Error(`gemini_${response.status}`);
  const text =
    (json?.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined)?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("") ?? "";
  const usage = json?.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;
  return {
    text,
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: usage?.candidatesTokenCount ?? 0,
    model,
    provider: "google",
  };
}

async function callAnthropic(model: string, messages: ProviderMessage[]): Promise<ProviderResult> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) throw new Error("ANTHROPIC_API_KEY is missing.");
  const system = messages.filter((item) => item.role === "system").map((item) => item.content).join("\n");
  const response = await timedFetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1800,
      temperature: 0.2,
      system,
      messages: messages.filter((item) => item.role === "user").map((item) => ({ role: "user", content: item.content })),
    }),
  });
  const json = parseJsonSafe(await response.text());
  if (!response.ok) throw new Error(`anthropic_${response.status}`);
  const text =
    (json?.content as Array<{ type?: string; text?: string }> | undefined)
      ?.filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("") ?? "";
  const usage = json?.usage as { input_tokens?: number; output_tokens?: number } | undefined;
  return {
    text,
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    model,
    provider: "anthropic",
  };
}

async function invoke(route: ModelRoute, messages: ProviderMessage[]): Promise<ProviderResult> {
  if (route.provider === "openai") return callOpenAi(route.model, messages);
  if (route.provider === "google") return callGemini(route.model, messages);
  return callAnthropic(route.model, messages);
}

async function invokeTracked(route: ModelRoute, messages: ProviderMessage[]): Promise<ProviderResult> {
  try {
    const result = await invoke(route, messages);
    recordProviderSuccess(route.provider);
    return result;
  } catch (error) {
    const opened = recordProviderFailure(route.provider);
    if (opened.openUntil > Date.now()) {
      console.warn("ai_circuit_open", { provider: route.provider });
    }
    throw error;
  }
}

function pickRoute(preferred: ModelRoute, fallback: ModelRoute): ModelRoute {
  if (!isCircuitOpen(preferred.provider as CircuitProvider)) return preferred;
  if (!isCircuitOpen(fallback.provider as CircuitProvider)) return fallback;
  throw new Error("ai_providers_unavailable");
}

export async function completeWithRouter(input: {
  capability: AiCapabilityName;
  plan: "FREE" | "PRO";
  messages: ProviderMessage[];
}): Promise<ProviderResult> {
  const scrubbed = input.messages.map((message) => ({
    ...message,
    content: redactSecrets(message.content).text.slice(0, 24_000),
  }));
  const primary = routeModel({ capability: input.capability, plan: input.plan });
  const fallback = fallbackRoute(primary.capability);
  const started = Date.now();
  const first = pickRoute(primary, fallback);
  try {
    const result = await invokeTracked(first, scrubbed);
    logComplete(result, Date.now() - started, primary.capability);
    return result;
  } catch {
    const second = first.provider === fallback.provider ? primary : fallback;
    if (isCircuitOpen(second.provider as CircuitProvider) && second.provider === first.provider) {
      throw new Error("ai_providers_unavailable");
    }
    const result = await invokeTracked(second, scrubbed);
    logComplete(result, Date.now() - started, primary.capability);
    return result;
  }
}
