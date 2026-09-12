const MICROS_PER_USD = 1_000_000;
const TOKENS_PER_MILLION = 1_000_000;

type ModelPrice = {
  inputMicrosPerMTok: number;
  outputMicrosPerMTok: number;
};

const MODEL_PRICES: Record<string, ModelPrice> = {
  "gpt-5.6-luna": { inputMicrosPerMTok: 200_000, outputMicrosPerMTok: 1_200_000 },
  "gpt-5.6-terra": { inputMicrosPerMTok: 2_000_000, outputMicrosPerMTok: 12_000_000 },
  "gemini-2.5-flash-lite": { inputMicrosPerMTok: 100_000, outputMicrosPerMTok: 400_000 },
  "gemini-2.5-flash": { inputMicrosPerMTok: 300_000, outputMicrosPerMTok: 2_500_000 },
  "claude-sonnet-5": { inputMicrosPerMTok: 2_000_000, outputMicrosPerMTok: 10_000_000 },
};

const DEFAULT_PRICE: ModelPrice = {
  inputMicrosPerMTok: 500_000,
  outputMicrosPerMTok: 3_000_000,
};

export const PRICE_REGISTRY_VERSION = "2026-09-09";

export function priceForModel(model: string): ModelPrice {
  return MODEL_PRICES[model] ?? DEFAULT_PRICE;
}

export function estimateCostMicros(input: {
  model: string;
  inputTokens: number;
  outputTokens: number;
}): number {
  const price = priceForModel(input.model);
  const inCost = (Math.max(0, input.inputTokens) * price.inputMicrosPerMTok) / TOKENS_PER_MILLION;
  const outCost = (Math.max(0, input.outputTokens) * price.outputMicrosPerMTok) / TOKENS_PER_MILLION;
  return Math.max(0, Math.round(inCost + outCost));
}

export function usdFromMicros(micros: number): number {
  return micros / MICROS_PER_USD;
}
