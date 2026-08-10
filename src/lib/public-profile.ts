import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { normalizeUsername } from "@/lib/username";

export type PublicIdentity = {
  fullName: string | null;
  username: string | null;
  profilePrivate: boolean;
};

// A private member still counts toward a build's proof, so their row stays but
// every identifying field is dropped. Removing the row instead would misstate
// who built the thing, which is the one claim this page exists to make.
export function publicIdentity(person: PublicIdentity): {
  fullName: string | null;
  username: string | null;
  redacted: boolean;
} {
  if (person.profilePrivate) {
    return { fullName: "Private builder", username: null, redacted: true };
  }

  return { fullName: person.fullName, username: person.username, redacted: false };
}

export const getPublicProfileByUsername = cache(async (rawUsername: string) => {
  const username = normalizeUsername(rawUsername);
  if (!username) return null;

  return prisma.user.findFirst({
    where: {
      username,
      onboarded: true,
      profilePrivate: false,
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      bio: true,
      imageUrl: true,
      role: true,
      skills: true,
      interests: true,
      githubUsername: true,
      showGithub: true,
      socialLinks: true,
      timezone: true,
    },
  });
});

export const getPublishedBuildBySlug = cache(async (slug: string) => {
  if (!slug) return null;

  return prisma.project.findFirst({
    where: {
      slug,
      publishedAt: { not: null },
      status: "COMPLETED",
      visibility: "PUBLIC",
    },
    include: {
      members: {
        orderBy: { joinedAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              imageUrl: true,
              role: true,
              profilePrivate: true,
            },
          },
        },
      },
      signatures: {
        where: { revokedAt: null },
        select: {
          signerId: true,
          subjectId: true,
          revokedAt: true,
          createdAt: true,
          statement: true,
          signer: { select: { fullName: true, username: true, profilePrivate: true } },
          subject: { select: { fullName: true, username: true, profilePrivate: true } },
        },
      },
      updates: {
        orderBy: { createdAt: "asc" },
        take: 30,
        select: {
          id: true,
          body: true,
          progress: true,
          createdAt: true,
          author: {
            select: { fullName: true, username: true, profilePrivate: true },
          },
        },
      },
    },
  });
});

export const getPublishedBuildsForUser = cache(async (userId: string) => {
  return prisma.project.findMany({
    where: {
      publishedAt: { not: null },
      status: "COMPLETED",
      visibility: "PUBLIC",
      members: { some: { userId } },
    },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      summary: true,
      publishedAt: true,
      techStack: true,
      members: {
        select: {
          user: {
            select: { fullName: true, username: true },
          },
        },
      },
    },
  });
});
