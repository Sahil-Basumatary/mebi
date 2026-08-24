import "server-only";

import { forumThreadPath } from "@/lib/forum";
import { prisma } from "@/lib/prisma";
import type { SearchResults } from "@/lib/search-types";
import { displayName } from "@/lib/user-display";

const MAX_QUERY = 64;
const PER_GROUP = 6;

function sanitizeQuery(raw: string): string {
  return raw.trim().slice(0, MAX_QUERY).replace(/[%_]/g, "").replace(/\s+/g, " ");
}

export async function searchAppContent(viewerId: string, rawQuery: string): Promise<SearchResults> {
  const q = sanitizeQuery(rawQuery);
  if (q.length < 2) {
    return { people: [], projects: [], threads: [] };
  }

  const contains = { contains: q, mode: "insensitive" as const };

  const [people, projects, threads] = await Promise.all([
    prisma.user.findMany({
      where: {
        onboarded: true,
        id: { not: viewerId },
        profilePrivate: false,
        OR: [
          { fullName: contains },
          { username: contains },
          { bio: contains },
          { skills: { has: q } },
          { interests: { has: q } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        username: true,
      },
      take: PER_GROUP,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.findMany({
      where: {
        AND: [
          {
            OR: [{ visibility: "PUBLIC" }, { members: { some: { userId: viewerId } } }],
          },
          {
            OR: [{ name: contains }, { description: contains }, { summary: contains }],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        publishedAt: true,
      },
      take: PER_GROUP,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.forumThread.findMany({
      where: { title: contains },
      select: {
        id: true,
        title: true,
        board: { select: { slug: true, title: true } },
      },
      take: PER_GROUP,
      orderBy: { lastPostedAt: "desc" },
    }),
  ]);

  return {
    people: people.map((person) => ({
      id: `person:${person.id}`,
      label: displayName(person.fullName, person.username),
      hint: person.username ? `@${person.username}` : "Builder",
      href: person.username ? `/u/${person.username}` : `/partners?q=${encodeURIComponent(q)}`,
    })),
    projects: projects.map((project) => ({
      id: `project:${project.id}`,
      label: project.name,
      hint: project.publishedAt
        ? "Proof"
        : project.status === "COMPLETED"
          ? "Completed"
          : "Project",
      href: `/projects/${project.id}`,
    })),
    threads: threads.map((thread) => ({
      id: `thread:${thread.id}`,
      label: thread.title,
      hint: thread.board.title,
      href: forumThreadPath(thread.board.slug, thread.id),
    })),
  };
}
