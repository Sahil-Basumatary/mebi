import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Chip, EmptyState, ProgressBar } from "@/components/layout";
import { requireOnboardedUser } from "@/lib/current-user";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { displayName, initials } from "@/lib/user-display";
import { NewProjectWindow } from "./new-project-window";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ProjectsPage() {
  const user = await requireOnboardedUser();
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
  const active = projects.filter((project) => project.status === "ACTIVE").length;
  const completed = projects.length - active;
  const updateCount = projects.reduce((sum, project) => sum + project._count.updates, 0);
  const averageProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <header className="border-app-divider bg-app-paper flex flex-col gap-4 border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
            Workspace
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-app-ink font-serif text-4xl leading-none font-light">Projects</h1>
            <span className="text-app-meta text-sm">{projects.length} total</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/discover"
            className="border-app-divider text-app-ink hover:bg-app-wash inline-flex h-10 items-center border px-4 text-sm font-medium transition-colors"
          >
            Discover
          </Link>
          <NewProjectWindow anchorId="new-project" />
        </div>
      </header>

      <dl className="border-app-divider bg-app-paper grid grid-cols-2 divide-x divide-y border sm:grid-cols-4 sm:divide-y-0">
        <ProjectStat label="Active" value={active} />
        <ProjectStat label="Completed" value={completed} />
        <ProjectStat label="Updates" value={updateCount} />
        <ProjectStat label="Average progress" value={`${averageProgress}%`} />
      </dl>

      {projects.length ? (
        <section
          role="table"
          aria-label="Your projects"
          className="border-app-divider bg-app-paper border"
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
            {projects.map((project) => {
              const lastActivity = project.updates[0]?.createdAt ?? project.updatedAt;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  role="row"
                  className="hover:bg-app-wash grid gap-4 px-4 py-4 transition-colors lg:grid-cols-[minmax(0,1.6fr)_9rem_8rem_12rem_2rem] lg:items-center"
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
                    <p className="text-app-body mt-1 line-clamp-1 text-sm">{project.description}</p>
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
          fill
          eyebrow="No projects"
          title="Your workspace is ready."
          action={<NewProjectWindow label="Create project" />}
        />
      )}
    </div>
  );
}

function ProjectStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4">
      <dt className="text-app-meta text-xs font-medium">{label}</dt>
      <dd className="text-app-ink mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
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
