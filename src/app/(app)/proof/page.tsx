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
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Proof"
        title="Verified builds you can put in front of an interviewer."
        description="Published proofs live on public URLs. Peer signatures are what make them credible."
      />

      <Section
        eyebrow="Published"
        title="Your proof pages"
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
                    <p className="text-app-body mt-2 line-clamp-2 max-w-3xl text-body-sm leading-6">
                      {project.summary ?? project.description}
                    </p>
                    <p className="text-app-meta mt-3 font-mono text-chip tracking-meta uppercase">
                      {project.members
                        .map((member) =>
                          displayName(member.user.fullName, member.user.username),
                        )
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
                  <div className="text-app-label font-mono text-meta tracking-meta md:text-right">
                    {project.publishedAt ? formatDate(project.publishedAt) : ""}
                    {project.slug ? (
                      <p className="mt-2 text-app-ink">/b/{project.slug}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </HairlineGrid>
        ) : (
          <EmptyState
            eyebrow="No published proof"
            title="Finish, attest, then publish."
            description="Completed projects stay private until you publish. Verified builds need a peer signature on every teammate."
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
        <Section eyebrow="Ready to publish" title="Finished, not public yet">
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
                  <p className="text-app-body text-body-sm leading-6">
                    {project.completedAt
                      ? `Finished ${formatDate(project.completedAt)}. Open the build to publish.`
                      : "Open the build to publish."}
                  </p>
                </Link>
              );
            })}
          </HairlineGrid>
        </Section>
      ) : null}
    </div>
  );
}
