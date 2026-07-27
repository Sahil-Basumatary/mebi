import Link from "next/link";
import { cache } from "react";
import {
  buildActivityYear,
  summarizeActivity,
  type BuildEvent,
} from "@/lib/build-activity";
import { requireOnboardedUser } from "@/lib/current-user";
import { resolveTimezone } from "@/lib/locale";
import { resolveNextAction } from "@/lib/next-action";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { displayName, initials } from "@/lib/user-display";

const loadSpine = cache(async () => {
  const user = await requireOnboardedUser();
  const [projects, pendingReceived, activityProjects] = await Promise.all([
    prisma.project.findMany({
      where: memberProjectWhere(user.id),
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: { id: true, name: true, status: true, progress: true },
    }),
    prisma.projectRequest.count({
      where: { toUserId: user.id, status: "PENDING" },
    }),
    prisma.project.findMany({
      where: memberProjectWhere(user.id),
      select: { createdAt: true, updatedAt: true, completedAt: true },
    }),
  ]);

  const activeProject =
    projects.find((project) => project.status === "ACTIVE") ?? projects[0] ?? null;
  const completedCount = projects.filter((project) => project.status === "COMPLETED").length;
  const nextAction = resolveNextAction({
    user,
    activeProject,
    pendingReceived,
    completedCount,
  });

  const events: BuildEvent[] = activityProjects.map((project) => ({
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    completedAt: project.completedAt?.toISOString() ?? null,
  }));
  const timeZone = resolveTimezone(user.timezone);
  const streak = summarizeActivity(buildActivityYear(events, timeZone)).currentStreak;

  return {
    name: displayName(user.fullName, user.username),
    initials: initials(user.fullName, user.username),
    imageUrl: user.imageUrl,
    streak,
    nextAction,
  };
});

export async function StatusSpine() {
  const spine = await loadSpine();

  return (
    <div className="border-app-divider bg-app-paper border-b">
      <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-12">
        <div className="flex min-w-0 items-center gap-3">
          {spine.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={spine.imageUrl}
              alt=""
              className="border-app-divider h-9 w-9 border object-cover"
            />
          ) : (
            <span className="border-app-divider bg-app-wash text-app-label flex h-9 w-9 items-center justify-center border font-mono text-chip tracking-meta">
              {spine.initials}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-app-ink truncate text-sm font-medium">{spine.name}</p>
            <p className="text-app-meta font-mono text-chip tracking-meta uppercase">
              {spine.streak > 0
                ? `${spine.streak}-day build streak`
                : "No active streak"}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-xl sm:items-end">
          <p className="text-app-label text-meta font-semibold tracking-rail uppercase">
            Next move
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
            <p className="text-app-body min-w-0 text-body-sm leading-snug sm:text-right">
              {spine.nextAction.detail}
            </p>
            <Link
              href={spine.nextAction.href}
              className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 shrink-0 items-center justify-center px-4 text-sm font-medium transition-colors"
            >
              {spine.nextAction.label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
