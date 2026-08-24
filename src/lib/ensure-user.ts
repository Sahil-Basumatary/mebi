import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ClerkIdentity = {
  clerkId: string;
  email: string;
  fullName: string | null;
  imageUrl: string | null;
};

const userSelect = {
  id: true,
  clerkId: true,
  email: true,
  fullName: true,
  username: true,
  bio: true,
  imageUrl: true,
  skills: true,
  interests: true,
  role: true,
  prefersSolo: true,
  onboarded: true,
} satisfies Prisma.UserSelect;

export type EnsuredUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

function isUniqueConflict(error: unknown, field: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; meta?: { target?: unknown } };
  if (candidate.code !== "P2002") return false;
  const target = candidate.meta?.target;
  const asText = Array.isArray(target) ? target.join(",") : String(target ?? "");
  return asText.includes(field);
}

export function isUsernameTakenError(error: unknown): boolean {
  return isUniqueConflict(error, "username");
}

export function isEmailTakenError(error: unknown): boolean {
  return isUniqueConflict(error, "email");
}

async function findByClerkOrEmail(clerkId: string, email: string): Promise<EnsuredUser | null> {
  return (
    (await prisma.user.findUnique({ where: { clerkId }, select: userSelect })) ??
    (await prisma.user.findUnique({ where: { email }, select: userSelect }))
  );
}

export async function ensureUserFromClerk(identity: ClerkIdentity): Promise<EnsuredUser> {
  const existing = await findByClerkOrEmail(identity.clerkId, identity.email);
  if (existing) {
    const clerkChanged = existing.clerkId !== identity.clerkId;
    const profileChanged =
      existing.email !== identity.email ||
      existing.fullName !== identity.fullName ||
      existing.imageUrl !== identity.imageUrl;
    if (!clerkChanged && !profileChanged) {
      return existing;
    }
    // Same verified email signing up again gets a new Clerk id; attach it
    // rather than inserting a second row that trips User_email_key.
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        clerkId: identity.clerkId,
        email: identity.email,
        fullName: identity.fullName,
        imageUrl: identity.imageUrl,
      },
      select: userSelect,
    });
  }

  try {
    return await prisma.user.create({
      data: {
        clerkId: identity.clerkId,
        email: identity.email,
        fullName: identity.fullName,
        imageUrl: identity.imageUrl,
      },
      select: userSelect,
    });
  } catch (error) {
    if (isUniqueConflict(error, "clerkId") || isUniqueConflict(error, "email")) {
      const raced = await findByClerkOrEmail(identity.clerkId, identity.email);
      if (raced) {
        if (raced.clerkId !== identity.clerkId) {
          return prisma.user.update({
            where: { id: raced.id },
            data: {
              clerkId: identity.clerkId,
              fullName: identity.fullName,
              imageUrl: identity.imageUrl,
            },
            select: userSelect,
          });
        }
        return raced;
      }
    }
    throw error;
  }
}
