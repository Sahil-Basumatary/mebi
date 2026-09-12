import "server-only";

import { PlanTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  advancedAllowance,
  capabilityForAction,
  capabilityForPlan,
  isProActive,
  standardAllowance,
  type AiActionName,
  type AiCapabilityName,
  type PlanTierName,
} from "@/lib/ai/quota";

const KILL_SWITCH_KEY = "ai_global_disabled";

export type EntitlementSnapshot = {
  userId: string;
  plan: PlanTierName;
  foundingOffer: boolean;
  aiConsentAt: Date | null;
  aiDisabled: boolean;
  globalDisabled: boolean;
};

export async function isAiGloballyDisabled(): Promise<boolean> {
  const flag = await prisma.appFlag.findUnique({
    where: { key: KILL_SWITCH_KEY },
    select: { value: true },
  });
  return flag?.value === "1";
}

export async function setAiGlobalDisabled(disabled: boolean): Promise<void> {
  await prisma.appFlag.upsert({
    where: { key: KILL_SWITCH_KEY },
    create: { key: KILL_SWITCH_KEY, value: disabled ? "1" : "0" },
    update: { value: disabled ? "1" : "0" },
  });
}

export async function loadEntitlements(userId: string): Promise<EntitlementSnapshot | null> {
  const [user, globalDisabled] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan: true,
        foundingOffer: true,
        planGrantedUntil: true,
        aiConsentAt: true,
        aiDisabled: true,
      },
    }),
    isAiGloballyDisabled(),
  ]);
  if (!user) return null;

  const pro = isProActive({
    plan: user.plan,
    planGrantedUntil: user.planGrantedUntil,
    now: new Date(),
  });

  return {
    userId: user.id,
    plan: pro ? PlanTier.PRO : PlanTier.FREE,
    foundingOffer: user.foundingOffer,
    aiConsentAt: user.aiConsentAt,
    aiDisabled: user.aiDisabled,
    globalDisabled,
  };
}

export function resolveCapability(
  snapshot: EntitlementSnapshot,
  requested: AiCapabilityName,
): AiCapabilityName {
  return capabilityForPlan(snapshot.plan, requested);
}

export function resolveCapabilityForAction(
  snapshot: EntitlementSnapshot,
  action: AiActionName,
): AiCapabilityName {
  return capabilityForAction(snapshot.plan, action);
}

export function standardAllowanceFor(snapshot: EntitlementSnapshot): number {
  return standardAllowance(snapshot.plan);
}

export function advancedAllowanceFor(snapshot: EntitlementSnapshot): number {
  return advancedAllowance(snapshot.plan);
}

export function entitlementsBlocked(snapshot: EntitlementSnapshot): string | null {
  if (snapshot.globalDisabled) {
    return "Hackollab AI is temporarily paused.";
  }
  if (snapshot.aiDisabled) {
    return "AI is disabled on this account.";
  }
  return null;
}

export async function grantBetaPro(userId: string, until: Date, foundingOffer: boolean) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: PlanTier.PRO,
      planGrantedUntil: until,
      foundingOffer,
    },
  });
}

export async function recordAiConsent(userId: string) {
  await setAiConsent(userId, true);
}

export async function setAiConsent(userId: string, consented: boolean) {
  await prisma.user.update({
    where: { id: userId },
    data: { aiConsentAt: consented ? new Date() : null },
  });
}

export async function setUserAiDisabled(userId: string, disabled: boolean) {
  await prisma.user.update({
    where: { id: userId },
    data: { aiDisabled: disabled },
  });
}
