export type PlanTierName = "FREE" | "PRO";
export type AiCapabilityName = "BACKGROUND" | "FREE" | "ADVANCED";
export type AiActionName =
  | "ARCHITECTURE"
  | "COMMIT_REVIEW"
  | "HINT"
  | "DOCS"
  | "BACKGROUND_INDEX";
export type RequestBucket = "standard" | "advanced" | "none";

export const FREE_STANDARD_REQUESTS = 50;
export const PRO_STANDARD_REQUESTS = 250;
export const PRO_ADVANCED_REQUESTS = 40;
export const FOUNDING_PRO_GBP = "6.99";
export const STANDARD_PRO_GBP = "8.99";
export const USD_MICROS = 1_000_000;
export const FREE_BETA_BUDGET_USD_MICROS = 40 * USD_MICROS;

export function globalBudgetMicros(): number {
  const raw = process.env.AI_GLOBAL_BUDGET_USD_MICROS?.trim();
  if (!raw) return FREE_BETA_BUDGET_USD_MICROS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return FREE_BETA_BUDGET_USD_MICROS;
  return parsed;
}

export const RATE_LIMITS: Record<PlanTierName, { hourly: number; daily: number }> = {
  FREE: { hourly: 10, daily: 30 },
  PRO: { hourly: 20, daily: 80 },
};
export const ACTION_CONTEXT_CHARS: Record<AiActionName, number> = {
  HINT: 12_000,
  ARCHITECTURE: 20_000,
  COMMIT_REVIEW: 20_000,
  DOCS: 20_000,
  BACKGROUND_INDEX: 8_000,
};
export const ESTIMATE_MICROS: Record<AiCapabilityName, number> = {
  BACKGROUND: 1_500,
  FREE: 5_000,
  ADVANCED: 40_000,
};

export function utcMonthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function nextUtcMonthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

export function standardAllowance(plan: PlanTierName): number {
  return plan === "PRO" ? PRO_STANDARD_REQUESTS : FREE_STANDARD_REQUESTS;
}

export function advancedAllowance(plan: PlanTierName): number {
  return plan === "PRO" ? PRO_ADVANCED_REQUESTS : 0;
}

export function capabilityForAction(
  plan: PlanTierName,
  action: AiActionName,
): AiCapabilityName {
  if (action === "BACKGROUND_INDEX") return "BACKGROUND";
  if (action === "HINT") return "FREE";
  if (plan === "PRO" && (action === "ARCHITECTURE" || action === "COMMIT_REVIEW" || action === "DOCS")) {
    return "ADVANCED";
  }
  return "FREE";
}

export function capabilityForPlan(
  plan: PlanTierName,
  requested: AiCapabilityName,
): AiCapabilityName {
  if (requested === "BACKGROUND") return "BACKGROUND";
  if (plan === "PRO") return requested === "ADVANCED" ? "ADVANCED" : "FREE";
  return "FREE";
}

export function bucketForCapability(capability: AiCapabilityName): RequestBucket {
  if (capability === "BACKGROUND") return "none";
  if (capability === "ADVANCED") return "advanced";
  return "standard";
}

export function remainingRequests(input: {
  used: number;
  reserved: number;
  allowance: number;
}): number {
  return Math.max(0, input.allowance - input.used - input.reserved);
}

export function canAfford(input: {
  used: number;
  reserved: number;
  allowance: number;
  cost: number;
}): boolean {
  if (input.cost <= 0) return true;
  return remainingRequests(input) >= input.cost;
}

export function isProActive(input: {
  plan: PlanTierName;
  planGrantedUntil: Date | null;
  now: Date;
}): boolean {
  if (input.plan === "PRO") {
    if (!input.planGrantedUntil) return true;
    return input.planGrantedUntil.getTime() > input.now.getTime();
  }
  return false;
}

export function rateWindowStart(now: Date, ms: number): Date {
  return new Date(now.getTime() - ms);
}
