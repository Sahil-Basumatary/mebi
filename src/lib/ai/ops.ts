import { globalBudgetMicros } from "@/lib/ai/quota";

export function shouldAlarmUsage(remaining: number, allowance: number): boolean {
  if (allowance <= 0) return false;
  return remaining / allowance <= 0.2;
}

export function shouldAlarmGlobalCost(
  usedMicros: number,
  budgetMicros = globalBudgetMicros(),
): boolean {
  if (!Number.isFinite(budgetMicros) || budgetMicros <= 0) return false;
  return usedMicros >= budgetMicros * 0.8;
}

export function isGlobalBudgetExhausted(
  usedMicros: number,
  budgetMicros = globalBudgetMicros(),
): boolean {
  if (!Number.isFinite(budgetMicros) || budgetMicros <= 0) return false;
  return usedMicros >= budgetMicros;
}

export function noteUsageBudget(input: {
  userId: string;
  remaining: number;
  allowance: number;
}): void {
  if (!shouldAlarmUsage(input.remaining, input.allowance)) return;
  console.warn("ai_budget_alarm", {
    userId: input.userId,
    remaining: input.remaining,
    allowance: input.allowance,
  });
}

export function noteGlobalCost(input: { usedMicros: number; budgetMicros?: number }): void {
  const budget = input.budgetMicros ?? globalBudgetMicros();
  if (isGlobalBudgetExhausted(input.usedMicros, budget)) {
    console.warn("ai_global_budget_exhausted", {
      usedMicros: input.usedMicros,
      budgetMicros: budget,
    });
    return;
  }
  if (shouldAlarmGlobalCost(input.usedMicros, budget)) {
    console.warn("ai_global_budget_alarm", {
      usedMicros: input.usedMicros,
      budgetMicros: budget,
    });
  }
}

