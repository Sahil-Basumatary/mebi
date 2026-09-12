import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cronAuthorized } from "@/lib/cron-auth";
import { globalBudgetMicros, utcMonthStart } from "@/lib/ai/quota";
import { isGlobalBudgetExhausted, noteGlobalCost } from "@/lib/ai/ops";
import { setAiGlobalDisabled } from "@/lib/entitlements";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const expiredNonces = await prisma.githubInstallNonce.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const periodStart = utcMonthStart(new Date());
  const usage = await prisma.aiUsagePeriod.aggregate({
    where: { periodStart },
    _sum: {
      creditsUsed: true,
      advancedUsed: true,
      costMicrosUsed: true,
    },
  });
  const standardUsed = usage._sum.creditsUsed ?? 0;
  const advancedUsed = usage._sum.advancedUsed ?? 0;
  const costMicrosUsed = usage._sum.costMicrosUsed ?? 0;
  noteGlobalCost({ usedMicros: costMicrosUsed, budgetMicros: globalBudgetMicros() });
  if (isGlobalBudgetExhausted(costMicrosUsed)) {
    await setAiGlobalDisabled(true);
  }

  return NextResponse.json({
    expiredNonces: expiredNonces.count,
    standardUsed,
    advancedUsed,
    costMicrosUsed,
  });
}
