import Link from "next/link";
import { BuildHeatmap } from "@/components/dashboard/build-heatmap";
import { BuildPath, type BuildStage } from "@/components/dashboard/build-path";
import {
  Chip,
  DataList,
  DataRow,
  EmptyState,
  MetaLine,
  ProgressBar,
  Section,
  UserRow,
} from "@/components/layout";
import { AppButton } from "@/components/ui/app-button";
import type { BuildEvent } from "@/lib/build-activity";
import { requireOnboardedUser } from "@/lib/current-user";
import { scoreMatch } from "@/lib/match";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { MIN_REAL_UPDATES, SYSTEM_UPDATE_BODIES } from "@/lib/proof";
import { displayName } from "@/lib/user-display";
import { PartnerRequestDialog } from "../partners/partner-request-dialog";

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export default async function HomePage() {
  const user = await requireOnboardedUser();
  const [
    projects,
    publishedCount,
    partnerPool,
    updateEvents,
    briefCount,
    activeCount,
    teamUpdateCount,
    loggedCount,
    witnessCount,
  ] = await Promise.all([
    prisma.project.findMany({
      where: memberProjectWhere(user.id),
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 5,
      include: {
        members: {
          select: {
            user: {
              select: { id: true, fullName: true, username: true, imageUrl: true },
            },
          },
        },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        _count: { select: { updates: true } },
      },
    }),
    prisma.project.count({
      where: {
        ...memberProjectWhere(user.id),
        publishedAt: { not: null },
      },
    }),
    user.profilePrivate
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: { onboarded: true, profilePrivate: false, id: { not: user.id } },
          orderBy: { updatedAt: "desc" },
          take: 40,
          select: {
            id: true,
            fullName: true,
            username: true,
            imageUrl: true,
            skills: true,
            interests: true,
            role: true,
          },
        }),
    prisma.projectUpdate.findMany({
      where: { project: memberProjectWhere(user.id) },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.project.count({ where: memberProjectWhere(user.id) }),
    prisma.project.count({
      where: { ...memberProjectWhere(user.id), status: "ACTIVE" },
    }),
    prisma.projectUpdate.count({
      where: { project: memberProjectWhere(user.id) },
    }),
    prisma.projectUpdate.count({
      where: {
        authorId: user.id,
        NOT: { body: { in: [...SYSTEM_UPDATE_BODIES] } },
      },
    }),
    prisma.proofSignature.count({
      where: { subjectId: user.id, revokedAt: null },
    }),
  ]);

  const buildEvents: BuildEvent[] = updateEvents.map((update) => ({
    at: update.createdAt.toISOString(),
  }));

  const activeProjects = projects.filter((project) => project.status === "ACTIVE");
  const inviteTarget =
    activeProjects.find((project) => project.members.length < 2) ?? activeProjects[0] ?? null;
  const memberIds = new Set(
    projects.flatMap((project) => project.members.map((member) => member.user.id)),
  );

  const inviteSuggestions = inviteTarget
    ? partnerPool
        .filter((candidate) => !memberIds.has(candidate.id))
        .map((candidate) => ({ candidate, breakdown: scoreMatch(user, candidate) }))
        .filter((entry) => entry.breakdown.score > 0)
        .sort((a, b) => b.breakdown.score - a.breakdown.score)
        .slice(0, 3)
    : [];

  const fixedProject = inviteTarget ? { id: inviteTarget.id, name: inviteTarget.name } : null;

  // Mirrors the proof gate in `lib/proof` so the path never promises a stage the
  // signing flow would still reject.
  const completed = {
    brief: briefCount > 0,
    log: loggedCount >= MIN_REAL_UPDATES,
    verify: witnessCount > 0,
    publish: publishedCount > 0,
  };
  const stageOrder = [
    {
      id: "brief",
      label: "Brief",
      hint: briefCount ? `${plural(briefCount, "brief")} filed` : "No brief yet",
    },
    {
      id: "log",
      label: "Log",
      hint: completed.log
        ? `${loggedCount} entries logged`
        : `${loggedCount}/${MIN_REAL_UPDATES} real entries`,
    },
    {
      id: "verify",
      label: "Verify",
      hint: witnessCount ? `${plural(witnessCount, "signature")} held` : "Not witnessed yet",
    },
    {
      id: "publish",
      label: "Publish",
      hint: publishedCount ? `${plural(publishedCount, "build")} public` : "Nothing public yet",
    },
  ] as const;
  const currentStageId = stageOrder.find((stage) => !completed[stage.id])?.id ?? null;
  const buildStages: BuildStage[] = stageOrder.map((stage) => ({
    ...stage,
    state: completed[stage.id] ? "done" : stage.id === currentStageId ? "current" : "todo",
  }));

  return (
    <div className="flex flex-1 flex-col gap-5">
      <header className="border-app-divider bg-app-paper flex flex-col gap-4 border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
            Workspace
          </p>
          <h1 className="text-app-ink mt-1 font-serif text-4xl leading-none font-light">Home</h1>
          <p className="text-app-body mt-2 text-sm">{displayName(user.fullName, user.username)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {publishedCount > 0 && user.username ? (
            <AppButton asChild variant="secondary">
              <Link href={`/u/${user.username}`}>Public profile</Link>
            </AppButton>
          ) : null}
          <AppButton asChild>
            <Link href="/projects#new-project">New project</Link>
          </AppButton>
        </div>
      </header>

      <dl className="border-app-divider bg-app-paper grid grid-cols-2 divide-x divide-y border sm:grid-cols-4 sm:divide-y-0">
        <HomeStat label="Projects" value={briefCount} />
        <HomeStat label="Active" value={activeCount} />
        <HomeStat label="Updates" value={teamUpdateCount} />
        <HomeStat label="Published" value={publishedCount} />
      </dl>

      <Section eyebrow="Proof path" title="Build status">
        <BuildPath stages={buildStages} />
      </Section>

      <Section
        eyebrow="Projects"
        title="Current work"
        action={
          <AppButton asChild variant="secondary" size="sm">
            <Link href="/projects">All projects</Link>
          </AppButton>
        }
      >
        {projects.length ? (
          <DataList ariaLabel="Current projects">
            {projects.map((project) => {
              const lastActivity = project.updates[0]?.createdAt ?? project.updatedAt;
              return (
                <DataRow key={project.id} className="p-0">
                  <Link
                    href={`/projects/${project.id}`}
                    className="hover:bg-app-wash grid gap-4 px-4 py-4 transition-colors md:grid-cols-[minmax(0,1fr)_10rem] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-app-ink text-base font-semibold">{project.name}</h2>
                        <Chip tone={project.status === "COMPLETED" ? "ink" : "wash"}>
                          {project.status.toLowerCase()}
                        </Chip>
                        {project.publishedAt ? <Chip tone="ink">published</Chip> : null}
                      </div>
                      <p className="text-app-body mt-1 line-clamp-1 text-sm">
                        {project.description}
                      </p>
                      <MetaLine className="mt-2">
                        <span>{plural(project.members.length, "member")}</span>
                        <span aria-hidden>·</span>
                        <span>{plural(project._count.updates, "update")}</span>
                        <span aria-hidden>·</span>
                        <span>{formatDate(lastActivity)}</span>
                      </MetaLine>
                    </div>
                    <ProgressBar value={project.progress} />
                  </Link>
                </DataRow>
              );
            })}
          </DataList>
        ) : (
          <EmptyState
            eyebrow="Empty pipeline"
            title="No builds yet."
            action={
              <AppButton asChild>
                <Link href="/projects#new-project">Create project</Link>
              </AppButton>
            }
          />
        )}
      </Section>

      {fixedProject && !user.profilePrivate ? (
        <Section
          eyebrow="Missing seat"
          title={`Who should join ${fixedProject.name}?`}
          action={
            <Link
              href="/partners"
              className="border-app-ink text-app-ink shrink-0 border-b pb-0.5 text-sm font-medium transition-opacity hover:opacity-60"
            >
              Full directory
            </Link>
          }
        >
          {inviteSuggestions.length ? (
            <DataList ariaLabel="Suggested partners">
              {inviteSuggestions.map(({ candidate, breakdown }) => {
                const shared = [...breakdown.sharedSkills, ...breakdown.sharedInterests].slice(
                  0,
                  4,
                );
                return (
                  <DataRow
                    key={candidate.id}
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <UserRow
                      fullName={candidate.fullName}
                      username={candidate.username}
                      imageUrl={candidate.imageUrl}
                      role={candidate.role}
                      meta={
                        shared.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {shared.map((tag) => (
                              <Chip key={tag} tone="ink">
                                {tag}
                              </Chip>
                            ))}
                          </div>
                        ) : null
                      }
                    />
                    <PartnerRequestDialog
                      toUserId={candidate.id}
                      toName={displayName(candidate.fullName, candidate.username)}
                      sharedSkills={breakdown.sharedSkills}
                      sharedInterests={breakdown.sharedInterests}
                      projects={[fixedProject]}
                      fixedProject={fixedProject}
                      triggerLabel="Invite to build"
                    />
                  </DataRow>
                );
              })}
            </DataList>
          ) : (
            <EmptyState
              eyebrow="No overlap yet"
              title="No matching builders yet."
              action={
                <AppButton asChild variant="secondary">
                  <Link href="/partners">Browse partners</Link>
                </AppButton>
              }
            />
          )}
        </Section>
      ) : null}

      <Section eyebrow="Activity" title="Build history">
        <div className="bg-app-paper border-app-divider border p-4 lg:p-5">
          <BuildHeatmap events={buildEvents} />
        </div>
      </Section>
    </div>
  );
}

function HomeStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4">
      <dt className="text-app-meta text-xs">{label}</dt>
      <dd className="text-app-ink mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
