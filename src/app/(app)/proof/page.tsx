import Link from "next/link";
import { Chip, EmptyState, HairlineGrid, PageHeader, Section } from "@/components/layout";
import { requireOnboardedUser } from "@/lib/current-user";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ProofPage() {
  const user = await requireOnboardedUser();
  const completed = await prisma.project.findMany({
    where: { ...memberProjectWhere(user.id), status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Proof"
        title="Evidence you can put in front of an interviewer."
        description="Finished projects will be shown here for your next pitch to recruiters."
      />

      <Section
        eyebrow="Build record"
        title="Finished projects"
        action={
          <span className="text-app-body text-sm">
            {completed.length} record{completed.length === 1 ? "" : "s"}
          </span>
        }
      >
        {completed.length ? (
          <HairlineGrid>
            {completed.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-app-paper hover:bg-app-wash grid gap-4 p-5 transition-colors md:grid-cols-[1fr_10rem] md:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-app-ink font-serif text-2xl font-light">{project.name}</h3>
                    <Chip tone="ink">completed</Chip>
                  </div>
                  <p className="text-app-body mt-2 line-clamp-2 max-w-3xl text-body-sm leading-6">
                    {project.description}
                  </p>
                  {project.techStack.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.techStack.slice(0, 6).map((tag) => (
                        <Chip key={tag}>{tag}</Chip>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="text-app-label font-mono text-meta tracking-meta md:text-right">
                  {project.completedAt ? formatDate(project.completedAt) : "Date unknown"}
                </div>
              </Link>
            ))}
          </HairlineGrid>
        ) : (
          <EmptyState
            eyebrow="No proof yet"
            title="Finish one project to open this ledger."
            description="Proof is earned by closing a loop — not by posting into an empty community feed."
            action={
              <Link
                href="/projects"
                className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center px-5 text-sm font-medium transition-colors"
              >
                Open pipeline
              </Link>
            }
          />
        )}
      </Section>
    </div>
  );
}
