import Link from "next/link";
import { Chip, EmptyState, HairlineGrid, PageHeader, Section } from "@/components/layout";
import { requireOnboardedUser } from "@/lib/current-user";
import { isProjectVerified } from "@/lib/proof";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ProofPage() {
  const user = await requireOnboardedUser();
  const published = await prisma.project.findMany({
    where: {
      ...memberProjectWhere(user.id),
      publishedAt: { not: null },
      status: "COMPLETED",
    },
    orderBy: { publishedAt: "desc" },
    include: {
      members: {
        select: {
          userId: true,
          user: { select: { fullName: true, username: true } },
        },
      },
      signatures: {
        where: { revokedAt: null },
        select: { signerId: true, subjectId: true, revokedAt: true },
      },
    },
  });

  const drafts = await prisma.project.findMany({
    where: {
      ...memberProjectWhere(user.id),
      status: "COMPLETED",
      publishedAt: null,
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      name: true,
      completedAt: true,
      members: { select: { userId: true } },
      signatures: {
        where: { revokedAt: null },
        select: { signerId: true, subjectId: true, revokedAt: true },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Proof"
        title="Published builds."
        description="Peer signatures distinguish verified work from self-attested work."
        aside={
          <div>
            <p className="text-app-label text-eyebrow tracking-eyebrow font-semibold uppercase">
              Recognition
            </p>
            <p className="text-app-body text-body-sm mt-3 leading-6">
              Badges and the leaderboard come from ships, attestations, and real build-log work.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/leaderboard"
                className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center px-4 text-sm font-medium transition-colors"
              >
                Leaderboard
              </Link>
              {user.username ? (
                <Link
                  href={`/u/${user.username}`}
                  className="border-app-ink text-app-ink inline-flex h-9 items-center border px-4 text-sm font-medium"
                >
                  Your badges
                </Link>
              ) : null}
            </div>
          </div>
        }
      />

      <Section
        eyebrow="Public"
        title="Proof pages"
        action={
          user.username ? (
            <Link
              href={`/u/${user.username}`}
              className="border-app-ink text-app-ink border-b pb-0.5 text-sm font-medium"
            >
              Public profile
            </Link>
          ) : null
        }
      >
        {published.length ? (
          <HairlineGrid>
            {published.map((project) => {
              const memberIds = project.members.map((member) => member.userId);
              const verified = isProjectVerified(memberIds, project.signatures);
              const href = project.slug ? `/b/${project.slug}` : `/projects/${project.id}`;
              return (
                <Link
                  key={project.id}
                  href={href}
                  className="bg-app-paper hover:bg-app-wash grid gap-4 p-5 transition-colors md:grid-cols-[1fr_10rem] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-app-ink font-serif text-2xl font-light">
                        {project.name}
                      </h3>
                      <Chip tone="ink">{verified ? "verified" : "self-attested"}</Chip>
                    </div>
                    <p className="text-app-body text-body-sm mt-2 line-clamp-2 max-w-3xl leading-6">
                      {project.summary ?? project.description}
                    </p>
                    <p className="text-app-meta text-chip tracking-meta mt-3 font-mono uppercase">
                      {project.members
                        .map((member) => displayName(member.user.fullName, member.user.username))
                        .join(" · ")}
                    </p>
                    {project.techStack.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.techStack.slice(0, 6).map((tag) => (
                          <Chip key={tag}>{tag}</Chip>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-app-label text-meta tracking-meta font-mono md:text-right">
                    {project.publishedAt ? formatDate(project.publishedAt) : ""}
                    {project.slug ? <p className="text-app-ink mt-2">/b/{project.slug}</p> : null}
                  </div>
                </Link>
              );
            })}
          </HairlineGrid>
        ) : (
          <EmptyState
            eyebrow="Nothing published"
            title="No proof pages yet."
            action={
              <Link
                href="/projects"
                className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center px-5 text-sm font-medium transition-colors"
              >
                Open builds
              </Link>
            }
          />
        )}
      </Section>

      {drafts.length ? (
        <Section eyebrow="Private" title="Finished builds">
          <HairlineGrid>
            {drafts.map((project) => {
              const verified = isProjectVerified(
                project.members.map((member) => member.userId),
                project.signatures,
              );
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="bg-app-paper hover:bg-app-wash grid gap-3 p-5 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-app-ink font-serif text-2xl font-light">{project.name}</h3>
                    <Chip>{verified ? "verified" : "needs attesting"}</Chip>
                  </div>
                  {project.completedAt ? (
                    <p className="text-app-meta text-chip tracking-meta font-mono uppercase">
                      {formatDate(project.completedAt)}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </HairlineGrid>
        </Section>
      ) : null}
    </div>
  );
}
