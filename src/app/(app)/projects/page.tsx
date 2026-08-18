import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { AppTabs, Chip, EmptyState, PageHeader, ProgressBar } from "@/components/layout";
import { AppButton } from "@/components/ui/app-button";
import { requireOnboardedUser } from "@/lib/current-user";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { displayName, initials } from "@/lib/user-display";
import { NewProjectWindow } from "./new-project-window";

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const view = first(params.view) === "completed" ? "completed" : "active";
  const projects = await prisma.project.findMany({
    where: memberProjectWhere(user.id),
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      techStack: true,
      visibility: true,
      status: true,
      progress: true,
      updatedAt: true,
      publishedAt: true,
      members: {
        orderBy: { joinedAt: "asc" },
        take: 4,
        select: {
          user: {
            select: {
              fullName: true,
              username: true,
              imageUrl: true,
            },
          },
        },
      },
      updates: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      _count: {
        select: {
          members: true,
          updates: true,
          requests: { where: { status: "PENDING" } },
        },
      },
    },
  });
  const active = projects.filter((project) => project.status === "ACTIVE");
  const completed = projects.filter((project) => project.status === "COMPLETED");
  const visible = view === "completed" ? completed : active;

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        density="compact"
        eyebrow="Workspace"
        title="Projects"
        description={projects.length ? `${projects.length} total` : undefined}
        actions={
          <>
            <AppButton asChild variant="secondary">
              <Link href="/discover">Discover</Link>
            </AppButton>
            <NewProjectWindow anchorId="new-project" />
          </>
        }
      />
      <div className="border-app-divider bg-app-paper border">
        {projects.length ? (
          <AppTabs
            attached
            ariaLabel="Project status"
            active={view}
            items={[
              { id: "active", label: "Active", count: active.length, href: "/projects" },
              {
                id: "completed",
                label: "Completed",
                count: completed.length,
                href: "/projects?view=completed",
              },
            ]}
          />
        ) : null}
        {visible.length ? (
          <section
            role="table"
            aria-label={view === "completed" ? "Completed projects" : "Active projects"}
          >
            <div
              role="row"
              className="text-app-meta border-app-divider hidden grid-cols-[minmax(0,1.6fr)_9rem_8rem_12rem_2rem] items-center gap-4 border-b px-4 py-2 font-mono text-[11px] tracking-[0.08em] uppercase lg:grid"
            >
              <span role="columnheader">Project</span>
              <span role="columnheader">Team</span>
              <span role="columnheader">Activity</span>
              <span role="columnheader">Progress</span>
              <span aria-hidden />
            </div>
            <div className="divide-app-divider divide-y">
              {visible.map((project) => {
                const lastActivity = project.updates[0]?.createdAt ?? project.updatedAt;
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    role="row"
                    className="hover:bg-app-wash grid gap-4 px-4 py-2.5 transition-colors lg:grid-cols-[minmax(0,1.6fr)_9rem_8rem_12rem_2rem] lg:items-center"
                  >
                    <div role="cell" className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-app-ink truncate text-base font-semibold">
                          {project.name}
                        </h2>
                        <Chip tone={project.status === "COMPLETED" ? "ink" : "wash"}>
                          {project.status.toLowerCase()}
                        </Chip>
                        {project.publishedAt ? <Chip tone="ink">published</Chip> : null}
                        {project._count.requests ? (
                          <Chip tone="paper">{project._count.requests} pending</Chip>
                        ) : null}
                      </div>
                      <p className="text-app-body mt-1 line-clamp-1 text-sm">
                        {project.description}
                      </p>
                      {project.techStack.length ? (
                        <p className="text-app-meta mt-2 truncate text-xs">
                          {project.techStack.slice(0, 5).join(" · ")}
                        </p>
                      ) : null}
                    </div>
                    <div role="cell" className="flex items-center gap-2">
                      <MemberStack members={project.members} />
                      <span className="text-app-meta text-xs tabular-nums">
                        {project._count.members}
                      </span>
                    </div>
                    <div role="cell">
                      <p className="text-app-ink text-sm font-medium tabular-nums">
                        {project._count.updates}
                      </p>
                      <p className="text-app-meta mt-0.5 text-xs">{formatDate(lastActivity)}</p>
                    </div>
                    <div role="cell">
                      <ProgressBar value={project.progress} />
                    </div>
                    <span role="cell" className="text-app-meta hidden lg:block">
                      <ArrowUpRight size={17} strokeWidth={1.75} aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <EmptyState
            variant="inline"
            eyebrow={projects.length ? "Empty list" : "No projects"}
            title={
              projects.length
                ? view === "completed"
                  ? "No completed projects yet."
                  : "No active projects."
                : "Your workspace is ready."
            }
          />
        )}
      </div>
    </div>
  );
}

function MemberStack({
  members,
}: {
  members: {
    user: {
      fullName: string | null;
      username: string | null;
      imageUrl: string | null;
    };
  }[];
}) {
  return (
    <span className="flex -space-x-2">
      {members.map(({ user }, index) => {
        const name = displayName(user.fullName, user.username);
        return user.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${name}-${index}`}
            src={user.imageUrl}
            alt=""
            title={name}
            className="border-app-paper h-7 w-7 rounded-full border-2 object-cover"
          />
        ) : (
          <span
            key={`${name}-${index}`}
            title={name}
            className="border-app-paper bg-app-wash text-app-label flex h-7 w-7 items-center justify-center rounded-full border-2 font-mono text-[9px] font-semibold"
          >
            {initials(user.fullName, user.username)}
          </span>
        );
      })}
    </span>
  );
}
