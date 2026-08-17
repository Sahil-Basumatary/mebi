import Link from "next/link";
import { cache } from "react";
import { AppButton } from "@/components/ui/app-button";
import { requireOnboardedUser } from "@/lib/current-user";
import { resolveNextAction, type NextActionProject } from "@/lib/next-action";
import { isProjectVerified, SYSTEM_UPDATE_BODIES } from "@/lib/proof";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

const loadSpine = cache(async () => {
  const user = await requireOnboardedUser();
  const [projects, pendingReceived, myUpdates, focusAuthors] = await Promise.all([
    prisma.project.findMany({
      where: memberProjectWhere(user.id),
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        publishedAt: true,
        visibility: true,
        members: { select: { userId: true } },
        signatures: {
          where: { revokedAt: null },
          select: { signerId: true, subjectId: true, revokedAt: true },
        },
      },
    }),
    prisma.projectRequest.count({
      where: { toUserId: user.id, status: "PENDING" },
    }),
    prisma.projectUpdate.findMany({
      where: {
        authorId: user.id,
        NOT: { body: { in: [...SYSTEM_UPDATE_BODIES] } },
      },
      select: { projectId: true },
      distinct: ["projectId"],
    }),
    prisma.projectUpdate.findMany({
      where: {
        project: {
          ...memberProjectWhere(user.id),
          status: "ACTIVE",
        },
        NOT: { body: { in: [...SYSTEM_UPDATE_BODIES] } },
      },
      select: { projectId: true, authorId: true },
    }),
  ]);

  const projectsWithMyRealUpdate = new Set(myUpdates.map((row) => row.projectId));
  const activityByProject = new Map<string, Set<string>>();
  for (const row of focusAuthors) {
    const set = activityByProject.get(row.projectId) ?? new Set<string>();
    set.add(row.authorId);
    activityByProject.set(row.projectId, set);
  }

  const focus =
    projects.find((project) => project.status === "ACTIVE") ??
    projects.find((project) => project.status === "COMPLETED" && !project.publishedAt) ??
    projects[0] ??
    null;

  let activeProject: NextActionProject | null = null;
  if (focus) {
    const memberIds = focus.members.map((member) => member.userId);
    const verified = isProjectVerified(memberIds, focus.signatures);
    const solo = memberIds.length === 1;
    const activeAuthors = activityByProject.get(focus.id) ?? new Set<string>();
    const awaitingMySignature = memberIds.some((subjectId) => {
      if (subjectId === user.id) return false;
      if (!activeAuthors.has(subjectId)) return false;
      return !focus.signatures.some(
        (signature) =>
          signature.signerId === user.id &&
          signature.subjectId === subjectId &&
          !signature.revokedAt,
      );
    });

    activeProject = {
      id: focus.id,
      name: focus.name,
      status: focus.status,
      progress: focus.progress,
      memberCount: memberIds.length,
      publishedAt: focus.publishedAt,
      needsMyUpdate: !projectsWithMyRealUpdate.has(focus.id),
      awaitingMySignature: focus.status === "ACTIVE" && memberIds.length > 1 && awaitingMySignature,
      readyToPublish:
        focus.status === "COMPLETED" &&
        !focus.publishedAt &&
        focus.visibility === "PUBLIC" &&
        (verified || solo),
    };
  }

  const publishedCount = projects.filter((project) => project.publishedAt).length;
  const nextAction = resolveNextAction({
    user,
    activeProject,
    pendingReceived,
    publishedCount,
  });

  return nextAction;
});

export async function StatusSpine() {
  const nextAction = await loadSpine();

  return (
    <aside aria-label="Status" className="border-app-divider bg-app-paper border-b">
      <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between gap-3 px-6 py-2 lg:px-12">
        <div className="flex min-w-0 items-center gap-3">
          <p className="text-app-label shrink-0 text-xs font-semibold tracking-[0.14em] uppercase">
            Next move
          </p>
          <span className="text-app-divider hidden sm:inline" aria-hidden>
            /
          </span>
          <p className="text-app-body hidden min-w-0 truncate text-sm sm:block">
            {nextAction.detail}
          </p>
        </div>
        <AppButton asChild size="sm">
          <Link href={nextAction.href}>{nextAction.label}</Link>
        </AppButton>
      </div>
    </aside>
  );
}
