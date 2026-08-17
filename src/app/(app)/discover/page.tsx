import Link from "next/link";
import { Chip, EmptyState, HairlineGrid, PageHeader, Section, UserRow } from "@/components/layout";
import { requireOnboardedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";
import { JoinRequestDialog } from "./join-request-dialog";

export default async function DiscoverPage() {
  const user = await requireOnboardedUser();

  const [openBuilds, myMemberships] = await Promise.all([
    prisma.project.findMany({
      where: {
        status: "ACTIVE",
        visibility: "PUBLIC",
        owner: { onboarded: true, profilePrivate: false },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: {
        id: true,
        name: true,
        description: true,
        techStack: true,
        estimatedTime: true,
        progress: true,
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
      },
    }),
    prisma.projectMember.findMany({
      where: { userId: user.id },
      select: { projectId: true },
    }),
  ]);

  const myProjectIds = new Set(myMemberships.map((row) => row.projectId));
  const builds = openBuilds.filter((project) => !myProjectIds.has(project.id));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Discover"
        title="Open builds looking for teammates."
        description="Public active projects you can ask to join."
        aside={
          <div>
            <p className="text-app-label text-eyebrow tracking-eyebrow font-semibold uppercase">
              Looking for people?
            </p>
            <p className="text-app-body text-body-sm mt-3 leading-6">
              Keep your brief public, then invite from Partners, or post in Looking for partners.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/projects#new-project"
                className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center px-4 text-sm font-medium transition-colors"
              >
                Start a brief
              </Link>
              <Link
                href="/forum/looking-for-partners"
                className="border-app-ink text-app-ink hover:bg-app-ink hover:text-app-paper inline-flex h-9 items-center border px-4 text-sm font-medium transition-colors"
              >
                Forum
              </Link>
            </div>
          </div>
        }
      />

      <Section eyebrow="Open" title="Active public builds">
        {builds.length ? (
          <HairlineGrid>
            {builds.map((project) => {
              const owner = project.members.find((member) => member.role === "OWNER")?.user;
              const askTargets = project.members
                .filter((member) => !member.user.profilePrivate)
                .map((member) => ({
                  id: member.user.id,
                  name: displayName(member.user.fullName, member.user.username),
                }));

              return (
                <article key={project.id} className="bg-app-paper flex flex-col gap-4 p-6">
                  <div>
                    <p className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                      {project.progress}% · {project.members.length} builder
                      {project.members.length === 1 ? "" : "s"}
                    </p>
                    <h3 className="text-app-ink mt-2 font-serif text-3xl font-light">
                      {project.name}
                    </h3>
                    <p className="text-app-body text-body-sm mt-3 max-w-2xl leading-6">
                      {project.description.slice(0, 220)}
                      {project.description.length > 220 ? "…" : ""}
                    </p>
                  </div>
                  {project.techStack.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {project.techStack.slice(0, 6).map((tag) => (
                        <Chip key={tag}>{tag}</Chip>
                      ))}
                    </div>
                  ) : null}
                  {owner ? (
                    <UserRow
                      fullName={owner.fullName}
                      username={owner.username}
                      imageUrl={owner.imageUrl}
                      role={owner.role}
                      meta={
                        <p className="text-app-meta text-chip tracking-meta mt-1 font-mono uppercase">
                          Owner
                          {project.estimatedTime ? ` · ${project.estimatedTime}` : ""}
                        </p>
                      }
                    />
                  ) : null}
                  {!user.profilePrivate && askTargets.length ? (
                    <JoinRequestDialog
                      projectId={project.id}
                      projectName={project.name}
                      members={askTargets}
                    />
                  ) : user.profilePrivate ? (
                    <p className="text-app-meta text-sm">
                      Turn off private profile to ask to join.
                    </p>
                  ) : null}
                </article>
              );
            })}
          </HairlineGrid>
        ) : (
          <EmptyState
            eyebrow="Quiet board"
            title="No open public builds right now."
            action={
              <Link
                href="/projects#new-project"
                className="border-app-ink text-app-ink border-b pb-0.5 text-sm font-medium"
              >
                Create one
              </Link>
            }
          />
        )}
      </Section>
    </div>
  );
}
