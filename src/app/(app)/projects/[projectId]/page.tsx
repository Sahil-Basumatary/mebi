import Link from "next/link";
import { ProjectRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/current-user";
import { requireProjectMember } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";
import { ProjectCompletionPanel } from "../project-completion-panel";
import { UpdateForm } from "../update-form";

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function formatDate(date: Date | null): string {
  if (!date) {
    return "Not finished";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStamp(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [{ projectId }, user] = await Promise.all([params, requireOnboardedUser()]);
  const project = await requireProjectMember(projectId, user.id);
  const isOwner = project.membership.role === ProjectRole.OWNER;
  const isCompleted = project.status === "COMPLETED";

  const updates = await prisma.projectUpdate.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      body: true,
      progress: true,
      createdAt: true,
      author: { select: { fullName: true, username: true } },
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button
          asChild
          variant="secondary"
          className="border-app-divider bg-app-paper text-app-ink hover:bg-app-chip rounded-full border px-5"
        >
          <Link href="/projects">Back to projects</Link>
        </Button>
      </div>

      <section className="border-app-divider bg-app-divider grid gap-px border xl:grid-cols-[1.25fr_0.75fr]">
        <div className="bg-app-paper p-8 lg:p-10">
          <div className="flex flex-wrap gap-2">
            <span className="border-app-divider bg-app-chip text-app-label border px-2 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
              {project.visibility.toLowerCase()}
            </span>
            <span className="border-app-divider bg-app-paper text-app-label border px-2 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
              {project.status.toLowerCase()}
            </span>
          </div>
          <h1 className="mt-5 max-w-4xl font-serif text-[clamp(2.7rem,6vw,5.4rem)] leading-[0.98] font-light tracking-[-0.04em]">
            {project.name}
          </h1>
          <p className="text-app-body mt-6 max-w-3xl text-[16px] leading-7">{project.description}</p>
        </div>
        <div className="bg-app-chip flex flex-col justify-between p-8 lg:p-10">
          <div>
            <p className="text-app-label text-[11px] font-semibold tracking-[0.24em] uppercase">
              Project status
            </p>
            <p className="mt-4 font-serif text-5xl font-light">{project.progress}%</p>
            <div className="bg-app-divider mt-5 h-2">
              <div className="bg-app-ink h-full" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
          <dl className="text-app-body mt-8 grid gap-4 text-sm">
            <div>
              <dt className="text-app-label text-[10px] font-semibold tracking-[0.16em] uppercase">
                Estimated time
              </dt>
              <dd className="mt-1">{project.estimatedTime || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-app-label text-[10px] font-semibold tracking-[0.16em] uppercase">
                Finished
              </dt>
              <dd className="mt-1">{formatDate(project.completedAt)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="border-app-divider bg-app-paper self-start border p-6">
          <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
            Build signal
          </p>
          <h2 className="mt-3 font-serif text-3xl font-light">What this project says so far</h2>
          <div className="mt-6 grid gap-3">
            {(project.techStack.length ? project.techStack : ["No stack tags yet"]).map((tag) => (
              <span
                key={tag}
                className="border-app-divider bg-app-wash text-app-body border px-3 py-2 text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <UpdateForm projectId={project.id} progress={project.progress} disabled={isCompleted} />
      </section>

      <section className="border-app-divider bg-app-paper border">
        <div className="border-app-divider border-b px-6 py-5">
          <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
            Timeline
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light">What the team posted</h2>
        </div>
        {updates.length ? (
          <ul className="divide-app-divider divide-y">
            {updates.map((update) => (
              <li key={update.id} className="px-6 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="text-app-ink text-sm font-medium">
                    {displayName(update.author.fullName, update.author.username)}
                  </p>
                  <p className="text-app-meta text-xs">{formatStamp(update.createdAt)}</p>
                </div>
                <p className="text-app-body mt-3 max-w-3xl text-body leading-6">{update.body}</p>
                {update.progress !== null ? (
                  <p className="text-app-label mt-3 font-mono text-chip tracking-meta uppercase">
                    Progress → {update.progress}%
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-app-body px-6 py-8 text-body-sm leading-6">
            No updates yet. Post the first one above.
          </p>
        )}
      </section>

      {isOwner ? <ProjectCompletionPanel projectId={project.id} disabled={isCompleted} /> : null}
    </div>
  );
}
