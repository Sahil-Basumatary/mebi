import Link from "next/link";
import {
  Chip,
  EmptyState,
  HairlineGrid,
  PageHeader,
  ProgressBar,
  Section,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/current-user";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { BriefChecklist, BriefSignalProvider } from "./brief-signal";
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
    where: memberProjectWhere(user.id),
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Project Pipeline"
        title="Turn a rough idea into something extraordinary."
        description="Create the project brief here, then use it as the source of truth for partner matching, sprint planning, and future proof capture."
      >
        <div aria-hidden className="flex items-center gap-4 py-8">
          <span className="flex items-center gap-1.5">
            <span
              className="border-app-meta/40 square-step h-2.5 w-2.5 border"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="bg-app-divider square-step h-2.5 w-2.5"
              style={{ animationDelay: "300ms" }}
            />
            <span
              className="bg-app-meta square-step h-2.5 w-2.5"
              style={{ animationDelay: "450ms" }}
            />
            <span
              className="bg-app-ink square-step h-2.5 w-2.5"
              style={{ animationDelay: "600ms" }}
            />
          </span>
          <span className="bg-app-divider h-px flex-1" />
          <span className="text-app-meta font-mono text-chip tracking-[0.2em] uppercase">
            Idea → Proof
          </span>
        </div>
      </PageHeader>

      <section id="new-project" className="grid gap-6 xl:grid-cols-[0.65fr_1.35fr]">
        <BriefSignalProvider>
          <div className="border-app-divider bg-app-paper self-start border p-6">
            <p className="text-app-label text-eyebrow font-semibold tracking-eyebrow uppercase">
              New brief
            </p>
            <h2 className="text-app-ink mt-3 font-serif text-3xl font-light">Time to Cook</h2>
            <p className="text-app-body mt-4 text-body-sm leading-6">Keep the first version tight.</p>
            <div className="border-app-divider mt-6 border-t pt-6">
              <BriefChecklist />
            </div>
          </div>
          <ProjectForm />
        </BriefSignalProvider>
      </section>

      <Section
        eyebrow="Workspace"
        title="Your project workspace"
        description="Public projects are visible to everyone. Private projects stay with you."
        action={
          <span className="text-app-body text-sm">
            {projects.length} project{projects.length === 1 ? "" : "s"}
          </span>
        }
      >
        {projects.length ? (
          <HairlineGrid>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-app-paper hover:bg-app-wash grid gap-5 p-5 transition-colors lg:grid-cols-[1fr_11rem_8rem] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-app-ink font-serif text-2xl font-light">{project.name}</h3>
                    <Chip>{project.visibility.toLowerCase()}</Chip>
                    <Chip tone="paper">{project.status.toLowerCase()}</Chip>
                  </div>
                  <p className="text-app-body mt-2 line-clamp-2 max-w-3xl text-body-sm leading-6">
                    {project.description}
                  </p>
                  <p className="text-app-label mt-3 text-xs">
                    Updated {formatDate(project.updatedAt)}
                  </p>
                </div>
                <ProgressBar value={project.progress} />
                <span className="text-app-ink text-sm font-medium lg:text-right">Open brief</span>
              </Link>
            ))}
          </HairlineGrid>
        ) : (
          <EmptyState
            eyebrow="No projects yet"
            title="Your first project is important for matching."
            description="Create one clear project brief first so we can match you with the right partners."
            action={
              <Button asChild className="rounded-full bg-app-ink text-app-paper hover:bg-app-accent-hover px-6">
                <Link href="#new-project">Create project</Link>
              </Button>
            }
          />
        )}
      </Section>
    </div>
  );
}
