export const SYSTEM_UPDATE_BODIES = new Set([
  "Opened the project brief.",
  "Marked the project complete.",
]);

export const DEFAULT_SIGNATURE_STATEMENT =
  "I confirm this person contributed real work on this build. Signing is also my consent for their name to appear on a published proof of this project.";

export type SignatureRow = {
  signerId: string;
  subjectId: string;
  revokedAt: Date | null;
};

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
