export const SYSTEM_UPDATE_BODIES = new Set([
  "Opened the project brief.",
  "Marked the project complete.",
]);

export const MIN_REAL_UPDATE_CHARS = 40;
export const MIN_REAL_UPDATES = 2;
export const MIN_DISTINCT_ACTIVITY_DAYS = 2;
export const MIN_ATTESTATION_CHARS = 40;
export const MAX_ATTESTATION_CHARS = 280;

export const DEFAULT_SIGNATURE_STATEMENT =
  "I confirm this person contributed real work on this build. Signing is also my consent for their name to appear on a published proof of this project.";

export type SignatureRow = {
  signerId: string;
  subjectId: string;
  revokedAt: Date | null;
};

export type ContributionUpdate = {
  body: string;
  createdAt: Date;
};

export type ContributionGate = {
  ok: boolean;
  reason?: string;
  realCount: number;
  distinctDays: number;
};

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function realUpdates(updates: ContributionUpdate[]): ContributionUpdate[] {
  return updates.filter(
    (update) =>
      !SYSTEM_UPDATE_BODIES.has(update.body) &&
      update.body.trim().length >= MIN_REAL_UPDATE_CHARS,
  );
}

// Peer signatures only unlock after sustained, substantive contribution — not a
// twelve-character drive-by post on the same afternoon.
export function evaluateContribution(updates: ContributionUpdate[]): ContributionGate {
  const real = realUpdates(updates);
  const distinctDays = new Set(real.map((update) => dayKey(update.createdAt))).size;

  if (real.length < MIN_REAL_UPDATES) {
    return {
      ok: false,
      reason: `Needs at least ${MIN_REAL_UPDATES} substantive posts (${MIN_REAL_UPDATE_CHARS}+ characters each).`,
      realCount: real.length,
      distinctDays,
    };
  }

  if (distinctDays < MIN_DISTINCT_ACTIVITY_DAYS) {
    return {
      ok: false,
      reason: "Contribution must span at least two different days.",
      realCount: real.length,
      distinctDays,
    };
  }

  return { ok: true, realCount: real.length, distinctDays };
}

export function isProjectVerified(
  memberIds: string[],
  signatures: SignatureRow[],
): boolean {
  if (memberIds.length < 2) return false;

  const members = new Set(memberIds);
  const active = signatures.filter(
    (signature) =>
      !signature.revokedAt &&
      signature.signerId !== signature.subjectId &&
      members.has(signature.signerId) &&
      members.has(signature.subjectId),
  );

  return memberIds.every((memberId) =>
    active.some((signature) => signature.subjectId === memberId),
  );
}

export function attestationCountFor(
  subjectId: string,
  signatures: SignatureRow[],
): number {
  return signatures.filter(
    (signature) =>
      !signature.revokedAt &&
      signature.subjectId === subjectId &&
      signature.signerId !== subjectId,
  ).length;
}
