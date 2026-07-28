import Link from "next/link";
import { BuildHeatmap } from "@/components/dashboard/build-heatmap";
import {
  Chip,
  EmptyState,
  HairlineGrid,
  PageHeader,
  ProgressBar,
  Section,
  UserRow,
} from "@/components/layout";
import { CubeField } from "@/components/three/cube-field";
import type { BuildEvent } from "@/lib/build-activity";
import { requireOnboardedUser } from "@/lib/current-user";
import { scoreMatch } from "@/lib/match";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";
import { PartnerRequestDialog } from "../partners/partner-request-dialog";

export default async function HomePage() {
  const user = await requireOnboardedUser();
  const [projects, publishedCount, partnerPool, updateEvents] = await Promise.all([
    prisma.project.findMany({
      where: memberProjectWhere(user.id),
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 5,
      include: {
        members: {
          select: {
            user: {
              select: { id: true, fullName: true, username: true, imageUrl: true },
            },
          },
        },
      },
    }),
    prisma.project.count({
      where: {
        ...memberProjectWhere(user.id),
        publishedAt: { not: null },
      },
    }),
    user.profilePrivate
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: { onboarded: true, profilePrivate: false, id: { not: user.id } },
          orderBy: { updatedAt: "desc" },
          take: 40,
          select: {
            id: true,
            fullName: true,
            username: true,
            imageUrl: true,
            skills: true,
            interests: true,
            role: true,
          },
        }),
    prisma.projectUpdate.findMany({
      where: { project: memberProjectWhere(user.id) },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  const buildEvents: BuildEvent[] = updateEvents.map((update) => ({
    at: update.createdAt.toISOString(),
  }));

  const activeProjects = projects.filter((project) => project.status === "ACTIVE");
  const inviteTarget =
    activeProjects.find((project) => project.members.length < 2) ?? activeProjects[0] ?? null;
  const memberIds = new Set(
    projects.flatMap((project) => project.members.map((member) => member.user.id)),
  );

  const inviteSuggestions = inviteTarget
    ? partnerPool
        .filter((candidate) => !memberIds.has(candidate.id))
        .map((candidate) => ({ candidate, breakdown: scoreMatch(user, candidate) }))
        .filter((entry) => entry.breakdown.score > 0)
        .sort((a, b) => b.breakdown.score - a.breakdown.score)
        .slice(0, 3)
    : [];

  const fixedProject = inviteTarget
    ? { id: inviteTarget.id, name: inviteTarget.name }
    : null;

  return (
    <div className="flex flex-col gap-10">
      <section className="border-app-divider bg-app-paper border p-8 lg:p-10">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <PageHeader
              eyebrow="Home"
              title="Build with someone. Publish proof that they signed."
              description="The loop is invite → log work → sign → publish. The spine above always names the single next move."
            />
            {publishedCount > 0 && user.username ? (
              <p className="text-app-body mt-6 text-body-sm">
                You have published proof.{" "}
                <Link
                  href={`/u/${user.username}`}
                  className="border-app-ink text-app-ink border-b pb-0.5 font-medium"
                >
                  View public profile
                </Link>
              </p>
            ) : null}
          </div>
          <div className="relative hidden h-72 w-[24rem] shrink-0 justify-self-end lg:block xl:h-80 xl:w-[28rem]">
            <CubeField className="absolute inset-0" />
            <div aria-hidden className="pointer-events-none absolute top-0 left-0">
              <span className="bg-app-ink text-app-paper inline-block px-3 py-1.5 font-mono text-meta tracking-meta">
                $ git init
              </span>
              <svg viewBox="0 0 120 70" fill="none" className="text-app-ink ml-3 h-[70px] w-[120px]">
                <path
                  className="line-draw"
                  pathLength="100"
                  d="M1 0 v46 h96"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <span className="text-app-meta pointer-events-none absolute right-0 bottom-1 font-mono text-meta tracking-meta">
              # tap a cube to commit it
            </span>
          </div>
        </div>
      </section>

      <Section
        eyebrow="Active builds"
        title="What you are shipping"
        action={
          <Link
            href="/projects"
            className="border-app-ink text-app-ink shrink-0 border-b pb-0.5 text-sm font-medium transition-opacity hover:opacity-60"
          >
            Open pipeline
          </Link>
        }
      >
        {projects.length ? (
          <HairlineGrid>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-app-paper hover:bg-app-wash grid gap-4 p-5 transition-colors md:grid-cols-[1fr_10rem] md:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-app-ink font-semibold">{project.name}</p>
                    <Chip>{project.status.toLowerCase()}</Chip>
                    {project.publishedAt ? <Chip tone="ink">published</Chip> : null}
                  </div>
                  <p className="text-app-body mt-2 line-clamp-1 text-body">{project.description}</p>
                  <p className="text-app-meta mt-3 font-mono text-chip tracking-meta uppercase">
                    {project.members
                      .map((member) =>
                        displayName(member.user.fullName, member.user.username),
                      )
                      .join(" · ")}
                  </p>
                </div>
                <ProgressBar value={project.progress} />
              </Link>
            ))}
          </HairlineGrid>
        ) : (
          <EmptyState
            eyebrow="Empty pipeline"
            title="No builds yet."
            description="Create a brief so there is a shared surface to invite someone into."
            action={
              <Link
                href="/projects"
                className="border-app-ink text-app-ink border-b pb-0.5 text-sm font-medium"
              >
                Start a build
              </Link>
            }
          />
        )}
      </Section>

      {fixedProject && !user.profilePrivate ? (
        <Section
          eyebrow="Missing seat"
          title={`Who should join ${fixedProject.name}?`}
          action={
            <Link
              href="/partners"
              className="border-app-ink text-app-ink shrink-0 border-b pb-0.5 text-sm font-medium transition-opacity hover:opacity-60"
            >
              Full directory
            </Link>
          }
        >
          {inviteSuggestions.length ? (
            <HairlineGrid>
              {inviteSuggestions.map(({ candidate, breakdown }) => {
                const shared = [...breakdown.sharedSkills, ...breakdown.sharedInterests].slice(
                  0,
                  4,
                );
                return (
                  <div key={candidate.id} className="bg-app-paper space-y-4 p-5">
                    <UserRow
                      fullName={candidate.fullName}
                      username={candidate.username}
                      imageUrl={candidate.imageUrl}
                      role={candidate.role}
                      meta={
                        shared.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {shared.map((tag) => (
                              <Chip key={tag} tone="ink">
                                {tag}
                              </Chip>
                            ))}
                          </div>
                        ) : null
                      }
                    />
                    <PartnerRequestDialog
                      toUserId={candidate.id}
                      toName={displayName(candidate.fullName, candidate.username)}
                      sharedSkills={breakdown.sharedSkills}
                      sharedInterests={breakdown.sharedInterests}
                      projects={[fixedProject]}
                      fixedProject={fixedProject}
                      triggerLabel="Invite to build"
                    />
                  </div>
                );
              })}
            </HairlineGrid>
          ) : (
            <EmptyState
              eyebrow="No overlap yet"
              title="No matching builders to invite."
              description="As more students onboard, people who share your skills show up here for this build."
              action={
                <Link
                  href="/partners"
                  className="border-app-ink text-app-ink border-b pb-0.5 text-sm font-medium"
                >
                  Browse partners
                </Link>
              }
            />
          )}
        </Section>
      ) : null}

      <div className="bg-app-paper border-app-divider border p-6 lg:p-8">
        <BuildHeatmap events={buildEvents} />
      </div>
    </div>
  );
}
