import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ProjectCompletionPanel } from "../project-completion-panel";
import { ProgressForm } from "../progress-form";

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

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [{ projectId }, user] = await Promise.all([params, requireOnboardedUser()]);
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: user.id,
    },
  });

  if (!project) {
    notFound();
  }

  const isCompleted = project.status === "COMPLETED";

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div>
          <Button asChild variant="secondary" className="rounded-full border-[#d8d8d8] bg-[#ffffff] px-5 text-[#000000] hover:bg-[#f4f4f4]">
            <Link href="/projects">Back to projects</Link>
          </Button>
        </div>

        <section className="grid gap-px border border-[#d8d8d8] bg-[#d8d8d8] xl:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-[#ffffff] p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">
              <span className="border border-[#d8d8d8] bg-[#f4f4f4] px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#555555] uppercase">
                {project.visibility.toLowerCase()}
              </span>
              <span className="border border-[#d8d8d8] bg-[#ffffff] px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#555555] uppercase">
                {project.status.toLowerCase()}
              </span>
            </div>
            <h1 className="mt-5 max-w-4xl font-serif text-[clamp(2.7rem,6vw,5.4rem)] leading-[0.98] font-light tracking-[-0.04em]">
              {project.name}
            </h1>
            <p className="mt-6 max-w-3xl text-sm leading-7 text-[#333333]">{project.description}</p>
          </div>
          <div className="flex flex-col justify-between bg-[#f4f4f4] p-8 lg:p-10">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
                Project status
              </p>
              <p className="mt-4 font-serif text-5xl font-light">{project.progress}%</p>
              <div className="mt-5 h-2 bg-[#d8d8d8]">
                <div className="h-full bg-[#000000]" style={{ width: `${project.progress}%` }} />
              </div>
            </div>
            <dl className="mt-8 grid gap-4 text-sm text-[#333333]">
              <div>
                <dt className="text-[10px] font-semibold tracking-[0.16em] text-[#555555] uppercase">
                  Estimated time
                </dt>
                <dd className="mt-1">{project.estimatedTime || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold tracking-[0.16em] text-[#555555] uppercase">
                  Finished
                </dt>
                <dd className="mt-1">{formatDate(project.completedAt)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="border border-[#d8d8d8] bg-[#ffffff] p-6">
            <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
              Build signal
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light">What this project says so far</h2>
            <div className="mt-6 grid gap-3">
              {(project.techStack.length ? project.techStack : ["No stack tags yet"]).map((tag) => (
                <span key={tag} className="border border-[#d8d8d8] bg-[#f7f7f7] px-3 py-2 text-sm text-[#333333]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <ProgressForm projectId={project.id} progress={project.progress} disabled={isCompleted} />
        </section>

        <ProjectCompletionPanel projectId={project.id} disabled={isCompleted} />
      </div>
    </AppShell>
  );
}
