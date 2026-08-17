import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Suspense } from "react";
import {
  Chip,
  DataList,
  DataRow,
  EmptyState,
  MetaLine,
  PageHeader,
  ProgressBar,
  Section,
  UserRow,
} from "@/components/layout";
import { AppButton } from "@/components/ui/app-button";
import { requireOnboardedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";
import { DiscoverFilters } from "./discover-filters";
import { JoinRequestDialog } from "./join-request-dialog";

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const query = first(params.q).trim();
  const stack = first(params.stack).trim();
  const sort = first(params.sort);

  const directoryWhere: Prisma.ProjectWhereInput = {
    status: "ACTIVE",
    visibility: "PUBLIC",
    owner: { onboarded: true, profilePrivate: false },
    members: { none: { userId: user.id } },
  };
  const filteredWhere: Prisma.ProjectWhereInput = {
    ...directoryWhere,
    ...(stack ? { techStack: { has: stack } } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.ProjectOrderByWithRelationInput =
    sort === "progress"
      ? { progress: "desc" }
      : sort === "team"
        ? { members: { _count: "desc" } }
        : { updatedAt: "desc" };

  const [builds, stackRows, projectCount, builderCount, updateCount, resultCount, pendingRequests] =
    await Promise.all([
      prisma.project.findMany({
        where: filteredWhere,
        orderBy,
        take: 100,
        select: {
          id: true,
          name: true,
          description: true,
          techStack: true,
          estimatedTime: true,
          progress: true,
          updatedAt: true,
          members: {
            orderBy: { joinedAt: "asc" },
            select: {
              role: true,
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
          updates: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
          _count: { select: { updates: true } },
        },
      }),
      prisma.project.findMany({
        where: directoryWhere,
        take: 500,
        select: { techStack: true },
      }),
      prisma.project.count({ where: directoryWhere }),
      prisma.projectMember.count({ where: { project: directoryWhere } }),
      prisma.projectUpdate.count({ where: { project: directoryWhere } }),
      prisma.project.count({ where: filteredWhere }),
      prisma.projectRequest.findMany({
        where: {
          fromUserId: user.id,
          kind: "JOIN",
          status: "PENDING",
        },
        select: { projectId: true },
      }),
    ]);

  const pendingProjectIds = new Set(pendingRequests.map((request) => request.projectId));
  const stacks = [
    ...new Set(stackRows.flatMap((project) => project.techStack.map((tag) => tag.trim()))),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        eyebrow="Open projects"
        title="Discover"
        description="Public projects accepting join requests."
      />

      <dl className="border-app-divider bg-app-paper grid grid-cols-3 divide-x border">
        <DiscoverStat label="Projects" value={projectCount} />
        <DiscoverStat label="Builders" value={builderCount} />
        <DiscoverStat label="Updates" value={updateCount} />
      </dl>

      <Suspense fallback={<div className="border-app-divider bg-app-paper h-10 border" />}>
        <DiscoverFilters stacks={stacks} />
      </Suspense>

      <Section
        eyebrow={query || stack ? "Filtered" : "Directory"}
        title="Open projects"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-app-meta mr-2 text-sm tabular-nums">
              {resultCount} result{resultCount === 1 ? "" : "s"}
            </span>
            <AppButton asChild variant="secondary" size="sm">
              <Link href="/forum/looking-for-partners">Partner forum</Link>
            </AppButton>
            <AppButton asChild size="sm">
              <Link href="/projects#new-project">New project</Link>
            </AppButton>
          </div>
        }
      >
        {builds.length ? (
          <DataList ariaLabel="Open projects">
            {builds.map((project) => {
              const owner = project.members.find((member) => member.role === "OWNER")?.user;
              const askTargets = project.members
                .filter((member) => !member.user.profilePrivate)
                .map((member) => ({
                  id: member.user.id,
                  name: displayName(member.user.fullName, member.user.username),
                }));

              return (
                <DataRow
                  key={project.id}
                  className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_10rem_11rem] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-app-ink text-base font-semibold">{project.name}</h3>
                      {pendingProjectIds.has(project.id) ? <Chip tone="ink">requested</Chip> : null}
                    </div>
                    <p className="text-app-body mt-1 line-clamp-2 max-w-3xl text-sm leading-5">
                      {project.description}
                    </p>
                    <MetaLine className="mt-2">
                      <span>
                        {project.members.length} builder
                        {project.members.length === 1 ? "" : "s"}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{project._count.updates} updates</span>
                      <span aria-hidden>·</span>
                      <span>{formatDate(project.updates[0]?.createdAt ?? project.updatedAt)}</span>
                      {project.estimatedTime ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>{project.estimatedTime}</span>
                        </>
                      ) : null}
                    </MetaLine>
                    {project.techStack.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {project.techStack.slice(0, 6).map((tag) => (
                          <Chip key={tag}>{tag}</Chip>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    {owner ? (
                      <UserRow
                        fullName={owner.fullName}
                        username={owner.username}
                        imageUrl={owner.imageUrl}
                        role={owner.role}
                        meta={<p className="text-app-meta mt-1 text-xs">Owner</p>}
                      />
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <ProgressBar value={project.progress} className="w-full" />
                    {pendingProjectIds.has(project.id) ? (
                      <span className="text-app-meta text-xs">Request pending</span>
                    ) : !user.profilePrivate && askTargets.length ? (
                      <JoinRequestDialog
                        projectId={project.id}
                        projectName={project.name}
                        members={askTargets}
                      />
                    ) : user.profilePrivate ? (
                      <span className="text-app-meta text-xs">Private profile</span>
                    ) : null}
                  </div>
                </DataRow>
              );
            })}
          </DataList>
        ) : (
          <EmptyState
            fill
            eyebrow={query || stack ? "No matches" : "Quiet board"}
            title={
              query || stack
                ? "No projects match these filters."
                : "No open public projects right now."
            }
            action={
              <AppButton asChild>
                <Link href="/projects#new-project">Create project</Link>
              </AppButton>
            }
          />
        )}
      </Section>
    </div>
  );
}

function DiscoverStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-app-meta text-xs">{label}</dt>
      <dd className="text-app-ink mt-1 text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
