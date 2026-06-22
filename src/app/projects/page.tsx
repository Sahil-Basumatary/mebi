import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "./project-form";

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
    where: { ownerId: user.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="grid gap-px border border-[#d8d8d8] bg-[#d8d8d8] xl:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-[#ffffff] p-8 lg:p-10">
            <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
              Project Pipeline
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.5rem,5vw,4.8rem)] leading-[0.98] font-light tracking-[-0.04em]">
              Turn a rough idea into a serious build.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#333333]">
              Create the project brief here, then use it as the source of truth for partner matching,
              sprint planning, and future proof capture.
            </p>
          </div>
          <div className="flex flex-col justify-between bg-[#f4f4f4] p-8 lg:p-10">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
                Primary action
              </p>
              <p className="mt-4 text-sm leading-6 text-[#333333]">
                A project should start with one clear problem, one missing role, and one visible next
                milestone.
              </p>
            </div>
            <Button asChild className="mt-8 rounded-full bg-[#000000] px-6 text-[#ffffff] hover:bg-[#333333]">
              <Link href="#new-project">
                Create project
              </Link>
            </Button>
          </div>
        </header>

        <section id="new-project" className="grid gap-6 xl:grid-cols-[0.65fr_1.35fr]">
          <div className="border border-[#d8d8d8] bg-[#ffffff] p-6">
            <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
              New brief
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light">Create from intent, not noise.</h2>
            <p className="mt-4 text-sm leading-6 text-[#333333]">
              Keep the first version tight. A good project record should tell a serious builder what
              the problem is, what stack is likely, and what progress would count as real.
            </p>
          </div>
          <ProjectForm />
        </section>

        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
                Workspace
              </p>
              <h2 className="font-serif text-3xl font-light">Your project workspace</h2>
              <p className="max-w-2xl text-sm leading-6 text-[#333333]">
                Public projects will become useful for partner matching. Private projects let you
                shape the brief before anyone else sees it.
              </p>
            </div>
            <span className="text-sm text-[#333333]">{projects.length} project{projects.length === 1 ? "" : "s"}</span>
          </div>

          {projects.length ? (
            <div className="mt-6 grid gap-px border border-[#d8d8d8] bg-[#d8d8d8]">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="grid gap-5 bg-[#ffffff] p-5 transition-colors hover:bg-[#f7f7f7] lg:grid-cols-[1fr_11rem_8rem] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-serif text-2xl font-light">{project.name}</h3>
                      <span className="border border-[#d8d8d8] bg-[#f4f4f4] px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#555555] uppercase">
                        {project.visibility.toLowerCase()}
                      </span>
                      <span className="border border-[#d8d8d8] bg-[#ffffff] px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#555555] uppercase">
                        {project.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-[#333333]">
                      {project.description}
                    </p>
                    <p className="mt-3 text-xs text-[#555555]">Updated {formatDate(project.updatedAt)}</p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-[#555555]">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-[#d8d8d8]">
                      <div className="h-full bg-[#000000]" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[#000000] lg:text-right">Open brief</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 border border-[#d8d8d8] bg-[#ffffff] p-8">
              <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
                No projects yet
              </p>
              <h3 className="mt-3 font-serif text-3xl font-light">Your first project becomes the matching anchor.</h3>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#333333]">
                Create one clear project brief first. Partner search works better when the system has
                an actual build to match against.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
