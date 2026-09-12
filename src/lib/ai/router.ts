import type { AiCapabilityName, PlanTierName } from "@/lib/ai/quota";

export type ModelRoute = {
  provider: "google" | "openai" | "anthropic";
  model: string;
  capability: AiCapabilityName;
};

const DEFAULTS: Record<AiCapabilityName, ModelRoute> = {
  BACKGROUND: { provider: "google", model: "gemini-2.5-flash-lite", capability: "BACKGROUND" },
  FREE: { provider: "openai", model: "gpt-5.6-luna", capability: "FREE" },
  ADVANCED: { provider: "openai", model: "gpt-5.6-terra", capability: "ADVANCED" },
};

const FALLBACKS: Record<AiCapabilityName, ModelRoute> = {
  BACKGROUND: { provider: "google", model: "gemini-2.5-flash-lite", capability: "BACKGROUND" },
  FREE: { provider: "google", model: "gemini-2.5-flash", capability: "FREE" },
  ADVANCED: { provider: "anthropic", model: "claude-sonnet-5", capability: "ADVANCED" },
};

export function routeModel(input: {
  capability: AiCapabilityName;
  plan: PlanTierName;
  preferFallback?: boolean;
}): ModelRoute {
  const capability =
    input.capability === "BACKGROUND"
      ? "BACKGROUND"
      : input.plan === "PRO" && input.capability === "ADVANCED"
        ? "ADVANCED"
        : "FREE";
  if (input.preferFallback) return FALLBACKS[capability];
  return DEFAULTS[capability];
}

export function fallbackRoute(capability: AiCapabilityName): ModelRoute {
  return FALLBACKS[capability];
}
