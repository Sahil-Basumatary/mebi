import "server-only";

import { AiUsageStatus, type AiActionKind, type AiCapability } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { estimateCostMicros } from "@/lib/ai/prices";
import {
  advancedAllowanceFor,
  entitlementsBlocked,
  loadEntitlements,
  setAiGlobalDisabled,
  standardAllowanceFor,
} from "@/lib/entitlements";
import {
  isGlobalBudgetExhausted,
  noteGlobalCost,
  noteUsageBudget,
} from "@/lib/ai/ops";
import {
  ESTIMATE_MICROS,
  RATE_LIMITS,
  advancedAllowance,
  bucketForCapability,
  canAfford,
  globalBudgetMicros,
  remainingRequests,
  standardAllowance,
  utcMonthStart,
  type AiActionName,
  type AiCapabilityName,
  type PlanTierName,
} from "@/lib/ai/quota";

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

async function recentRequestCount(userId: string, since: Date): Promise<number> {
  return prisma.aiUsageEvent.count({
    where: {
      userId,
      createdAt: { gte: since },
      status: { in: [AiUsageStatus.RESERVED, AiUsageStatus.SETTLED] },
      credits: { gt: 0 },
    },
  });
}

async function periodProviderCostMicros(periodStart: Date): Promise<number> {
  const sum = await prisma.aiUsagePeriod.aggregate({
    where: { periodStart },
    _sum: { costMicrosUsed: true },
  });
  return sum._sum.costMicrosUsed ?? 0;
}

export async function reserveAiCredits(input: {
  userId: string;
  requestId: string;
  action: AiActionName;
  capability: AiCapability;
}): Promise<{ credits: number; remaining: number; plan: PlanTierName }> {
  const snapshot = await loadEntitlements(input.userId);
  if (!snapshot) {
    throw new QuotaError("Account not found.");
  }
  const blocked = entitlementsBlocked(snapshot);
  if (blocked) {
    throw new QuotaError(blocked);
  }

  const capability = input.capability as AiCapabilityName;
  const bucket = bucketForCapability(capability);
  const standardCost = bucket === "standard" ? 1 : 0;
  const advancedCost = bucket === "advanced" ? 1 : 0;
  const periodStart = utcMonthStart(new Date());
  const standardCap = standardAllowanceFor(snapshot);
  const advancedCap = advancedAllowanceFor(snapshot);
  const limits = RATE_LIMITS[snapshot.plan];
  const now = new Date();

  if (standardCost + advancedCost > 0) {
    const [hourly, daily] = await Promise.all([
      recentRequestCount(input.userId, new Date(now.getTime() - 60 * 60 * 1000)),
      recentRequestCount(input.userId, new Date(now.getTime() - 24 * 60 * 60 * 1000)),
    ]);
    if (hourly >= limits.hourly) {
      throw new QuotaError("Too many AI requests this hour. Try again shortly.");
    }
    if (daily >= limits.daily) {
      throw new QuotaError("Too many AI requests today. Try again tomorrow.");
    }
  }

  const globalUsed = await periodProviderCostMicros(periodStart);
  noteGlobalCost({ usedMicros: globalUsed });
  if (isGlobalBudgetExhausted(globalUsed + ESTIMATE_MICROS[capability], globalBudgetMicros())) {
    await setAiGlobalDisabled(true);
    throw new QuotaError("Hackollab AI is paused while we protect this month’s provider budget.");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.aiUsageEvent.findUnique({
        where: { requestId: input.requestId },
        select: { credits: true, status: true },
      });
      if (existing) {
        const period = await tx.aiUsagePeriod.findUnique({
          where: { userId_periodStart: { userId: input.userId, periodStart } },
        });
        return {
          credits: existing.credits,
          remaining: remainingRequests({
            used: period?.creditsUsed ?? 0,
            reserved: period?.creditsReserved ?? 0,
            allowance: standardCap,
          }),
          plan: snapshot.plan,
        };
      }

      const period = await tx.aiUsagePeriod.upsert({
        where: { userId_periodStart: { userId: input.userId, periodStart } },
        create: { userId: input.userId, periodStart },
        update: {},
      });

      if (
        !canAfford({
          used: period.creditsUsed,
          reserved: period.creditsReserved,
          allowance: standardCap,
          cost: standardCost,
        })
      ) {
        throw new QuotaError("You have used this month’s Standard AI allowance.");
      }
      if (
        !canAfford({
          used: period.advancedUsed,
          reserved: period.advancedReserved,
          allowance: advancedCap,
          cost: advancedCost,
        })
      ) {
        throw new QuotaError("You have used this month’s Advanced AI allowance.");
      }

      const reservedRows = await tx.$executeRaw`
        UPDATE "AiUsagePeriod"
        SET
          "creditsReserved" = "creditsReserved" + ${standardCost},
          "advancedReserved" = "advancedReserved" + ${advancedCost}
        WHERE "id" = ${period.id}
          AND "creditsUsed" + "creditsReserved" + ${standardCost} <= ${standardCap}
          AND "advancedUsed" + "advancedReserved" + ${advancedCost} <= ${advancedCap}
      `;
      if (Number(reservedRows) !== 1) {
        throw new QuotaError(
          advancedCost > 0
            ? "You have used this month’s Advanced AI allowance."
            : "You have used this month’s Standard AI allowance.",
        );
      }
      await tx.aiUsageEvent.create({
        data: {
          userId: input.userId,
          requestId: input.requestId,
          capability: input.capability,
          action: input.action as AiActionKind,
          credits: standardCost + advancedCost,
          status: AiUsageStatus.RESERVED,
        },
      });

      return {
        credits: standardCost + advancedCost,
        remaining: remainingRequests({
          used: period.creditsUsed,
          reserved: period.creditsReserved + standardCost,
          allowance: standardCap,
        }),
        plan: snapshot.plan,
      };
    });
    if (standardCost > 0) {
      noteUsageBudget({
        userId: input.userId,
        remaining: result.remaining,
        allowance: standardCap,
      });
    }
    return result;
  } catch (error) {
    if (error instanceof QuotaError) throw error;
    throw error;
  }
}

export async function settleAiCredits(input: {
  requestId: string;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  latencyMs?: number;
}) {
  const costMicros =
    input.model && (input.inputTokens || input.outputTokens)
      ? estimateCostMicros({
          model: input.model,
          inputTokens: input.inputTokens ?? 0,
          outputTokens: input.outputTokens ?? 0,
        })
      : 0;

  await prisma.$transaction(async (tx) => {
    const event = await tx.aiUsageEvent.findUnique({
      where: { requestId: input.requestId },
    });
    if (!event || event.status !== AiUsageStatus.RESERVED) return;

    const periodStart = utcMonthStart(event.createdAt);
    const bucket = bucketForCapability(event.capability);
    const standardCost = bucket === "standard" ? event.credits : 0;
    const advancedCost = bucket === "advanced" ? event.credits : 0;

    await tx.aiUsageEvent.update({
      where: { id: event.id },
      data: {
        status: AiUsageStatus.SETTLED,
        settledAt: new Date(),
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        model: input.model ?? null,
        latencyMs: input.latencyMs ?? null,
        costMicros,
      },
    });
    await tx.aiUsagePeriod.update({
      where: { userId_periodStart: { userId: event.userId, periodStart } },
      data: {
        creditsReserved: { decrement: standardCost },
        creditsUsed: { increment: standardCost },
        advancedReserved: { decrement: advancedCost },
        advancedUsed: { increment: advancedCost },
        costMicrosUsed: { increment: costMicros },
      },
    });
  });

  if (costMicros > 0) {
    const used = await periodProviderCostMicros(utcMonthStart(new Date()));
    noteGlobalCost({ usedMicros: used, budgetMicros: globalBudgetMicros() });
    if (isGlobalBudgetExhausted(used)) {
      await setAiGlobalDisabled(true);
    }
  }
}

export async function refundAiCredits(requestId: string) {
  await prisma.$transaction(async (tx) => {
    const event = await tx.aiUsageEvent.findUnique({
      where: { requestId },
    });
    if (!event || event.status !== AiUsageStatus.RESERVED) return;
    const periodStart = utcMonthStart(event.createdAt);
    const bucket = bucketForCapability(event.capability);
    const standardCost = bucket === "standard" ? event.credits : 0;
    const advancedCost = bucket === "advanced" ? event.credits : 0;
    await tx.aiUsageEvent.update({
      where: { id: event.id },
      data: { status: AiUsageStatus.REFUNDED, settledAt: new Date() },
    });
    await tx.aiUsagePeriod.update({
      where: { userId_periodStart: { userId: event.userId, periodStart } },
      data: {
        creditsReserved: { decrement: standardCost },
        advancedReserved: { decrement: advancedCost },
      },
    });
  });
}

export async function usageSummary(userId: string, plan: PlanTierName) {
  const periodStart = utcMonthStart(new Date());
  const period = await prisma.aiUsagePeriod.findUnique({
    where: { userId_periodStart: { userId, periodStart } },
  });
  const standardCap = standardAllowance(plan);
  const advancedCap = advancedAllowance(plan);
  const standardUsed = period?.creditsUsed ?? 0;
  const standardReserved = period?.creditsReserved ?? 0;
  const advancedUsed = period?.advancedUsed ?? 0;
  const advancedReserved = period?.advancedReserved ?? 0;
  return {
    standard: {
      allowance: standardCap,
      used: standardUsed,
      reserved: standardReserved,
      remaining: remainingRequests({
        used: standardUsed,
        reserved: standardReserved,
        allowance: standardCap,
      }),
    },
    advanced: {
      allowance: advancedCap,
      used: advancedUsed,
      reserved: advancedReserved,
      remaining: remainingRequests({
        used: advancedUsed,
        reserved: advancedReserved,
        allowance: advancedCap,
      }),
    },
    periodStart,
  };
}
