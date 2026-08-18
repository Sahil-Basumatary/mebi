import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Suspense } from "react";
import {
  Chip,
  DataList,
  DataRow,
  EmptyState,
  ListColumns,
  MetaLine,
  PageHeader,
  ProgressBar,
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

  const [builds, stackRows, resultCount, pendingRequests] = await Promise.all([
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
    <div className="flex flex-col gap-3">
      <PageHeader
        density="compact"
        eyebrow="Open projects"
        title="Discover"
        description="Public projects accepting join requests."
        actions={
          <AppButton asChild variant="secondary">
            <Link href="/forum/looking-for-partners">Partner forum</Link>
          </AppButton>
        }
      />
      <DataList
        ariaLabel="Open projects"
        toolbar={
          <Suspense fallback={<div className="h-20" />}>
            <DiscoverFilters stacks={stacks} resultCount={resultCount} />
          </Suspense>
        }
        columns={
          builds.length ? (
            <ListColumns className="grid-cols-[minmax(0,1fr)_10rem_11rem]">
              <span>Project</span>
              <span>Owner</span>
              <span className="text-right">Action</span>
            </ListColumns>
          ) : null
        }
        empty={
          <EmptyState
            variant="inline"
            eyebrow={query || stack ? "No matches" : "Quiet board"}
            title={
              query || stack
                ? "No projects match these filters."
                : "No open public projects right now."
            }
          />
        }
      >
        {builds.length
          ? builds.map((project) => {
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
                  className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_11rem] lg:items-center"
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
            })
          : null}
      </DataList>
    </div>
  );
}
