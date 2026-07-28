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
import { SocialIcon } from "@/components/social-icon";
import { CubeField } from "@/components/three/cube-field";
import type { BuildEvent } from "@/lib/build-activity";
import { requireOnboardedUser } from "@/lib/current-user";
import { scoreMatch } from "@/lib/match";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { displayName, ROLE_LABEL } from "@/lib/user-display";
import { cn } from "@/lib/utils";

const STAGE_ICONS = [
  <svg
    key="profile"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-full w-full"
  >
    <circle cx="24" cy="17" r="7" />
    <path d="M11 39c0-7.2 5.8-13 13-13s13 5.8 13 13" />
  </svg>,
  <svg
    key="project"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-full w-full"
  >
    <rect x="9" y="11" width="30" height="26" rx="1.5" />
    <line x1="19" y1="11" x2="19" y2="37" />
    <line x1="29" y1="11" x2="29" y2="37" />
    <line x1="12.5" y1="17" x2="15.5" y2="17" />
    <line x1="22.5" y1="17" x2="25.5" y2="17" />
    <line x1="32.5" y1="17" x2="35.5" y2="17" />
  </svg>,
  <svg
    key="partner"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-full w-full"
  >
    <circle cx="16" cy="18" r="5.5" />
    <circle cx="32" cy="30" r="5.5" />
    <line x1="20" y1="21.5" x2="28" y2="26.5" />
  </svg>,
  <svg
    key="proof"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-full w-full"
  >
    <path d="M15 8h11l7 7v23a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" />
    <path d="M26 8v7h7" />
    <path d="M18 29l4 4 8-9" />
  </svg>,
];

export default async function HomePage() {
  const user = await requireOnboardedUser();
  const [projects, completedCount, partnerPool, updateEvents] =
    await Promise.all([
      prisma.project.findMany({
        where: memberProjectWhere(user.id),
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 3,
      }),
      prisma.project.count({
        where: { ...memberProjectWhere(user.id), status: "COMPLETED" },
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

  const overlapBuilders = partnerPool
    .map((candidate) => ({ candidate, breakdown: scoreMatch(user, candidate) }))
    .filter((entry) => entry.breakdown.score > 0)
    .sort((a, b) => b.breakdown.score - a.breakdown.score)
    .slice(0, 3);

  const activeProject = projects.find((project) => project.status === "ACTIVE") ?? projects[0] ?? null;

  const buildPath = [
    {
      label: "Profile",
      status: user.bio ? "Signal present" : "Missing thesis",
      done: Boolean(user.bio && user.skills.length),
      href: "/onboarding",
      action: "Edit",
    },
    {
      label: "Project",
      status: activeProject ? `${activeProject.progress}% built` : "Not started",
      done: Boolean(activeProject),
      href: activeProject ? `/projects/${activeProject.id}` : "/projects",
      action: activeProject ? "Open" : "Create",
    },
    {
      label: "Partner",
      status: user.skills.length ? "Ready to search" : "Index skills first",
      done: false,
      href: "/partners",
      action: "Find",
    },
    {
      label: "Proof",
      status: completedCount ? `${completedCount} captured` : "No evidence yet",
      done: completedCount > 0,
      href: "/proof",
      action: "Log",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section className="border-app-divider bg-app-paper border p-8 lg:p-10">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <PageHeader
              eyebrow="Home"
              title="Get your first serious project live."
              description="Brief the project, find the missing partner, then capture proof. One path, one next move."
            />
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
        eyebrow="Build path"
        title="Four checkpoints"
        action={
          <span className="text-app-label hidden font-mono text-meta tracking-chip uppercase sm:inline">
            Profile → Project → Partner → Proof
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {buildPath.map((stage, index) => (
            <div
              key={stage.label}
              className="border-app-divider bg-app-paper hover:border-app-ink group/step flex flex-col border transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)]"
            >
              <div className="bg-app-ink relative aspect-[3/2] w-full overflow-hidden">
                <div className="flex h-full w-full items-center justify-center">
                  <div className="text-app-paper h-12 w-12 transition-transform duration-200 group-hover/step:scale-110">
                    {STAGE_ICONS[index]}
                  </div>
                </div>
                <span
                  className={cn(
                    "absolute top-3 left-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm",
                    stage.done
                      ? "bg-app-paper text-app-ink"
                      : "border-app-meta text-app-paper border bg-transparent",
                  )}
                >
                  {index + 1}
                </span>
                <span className="text-app-meta absolute top-4 right-3 font-mono text-chip tracking-chip">
                  {stage.done ? "DONE" : "OPEN"}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <p className="text-app-ink font-semibold">{stage.label}</p>
                  <p className="text-app-body mt-1 text-sm">{stage.status}</p>
                </div>
                <Link
                  href={stage.href}
                  className="border-app-ink text-app-ink mt-auto inline-flex w-fit items-center gap-1 border-b pb-0.5 text-sm font-medium transition-opacity hover:opacity-60"
                >
                  {stage.action}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Active build records"
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
                  </div>
                  <p className="text-app-body mt-2 line-clamp-1 text-body">{project.description}</p>
                </div>
                <ProgressBar value={project.progress} />
              </Link>
            ))}
          </HairlineGrid>
        ) : (
          <EmptyState
            eyebrow="Empty pipeline"
            title="No project records yet."
            description="Create the first brief in Project Pipeline so partner matching has something concrete to reason about."
            action={
              <Link
                href="/projects"
                className="border-app-ink text-app-ink border-b pb-0.5 text-sm font-medium"
              >
                Open pipeline
              </Link>
            }
          />
        )}
      </Section>

      <Section
        eyebrow="Builders similar to you"
        title={overlapBuilders.length ? "People worth reaching out to" : "Be one of the first"}
        action={
          <Link
            href="/partners"
            className="border-app-ink text-app-ink shrink-0 border-b pb-0.5 text-sm font-medium transition-opacity hover:opacity-60"
          >
            Browse all
          </Link>
        }
      >
        {overlapBuilders.length ? (
          <HairlineGrid>
            {overlapBuilders.map(({ candidate, breakdown }) => {
              const shared = [...breakdown.sharedSkills, ...breakdown.sharedInterests].slice(0, 4);
              return (
                <Link
                  key={candidate.id}
                  href="/partners"
                  className="bg-app-paper hover:bg-app-wash block p-5 transition-colors"
                >
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
                    action={
                      <span className="text-app-label hidden font-mono text-meta tracking-chip sm:inline">
                        {breakdown.sharedSkills.length + breakdown.sharedInterests.length} SHARED
                      </span>
                    }
                  />
                </Link>
              );
            })}
          </HairlineGrid>
        ) : (
          <EmptyState
            eyebrow="Early network"
            title="No overlapping builders yet."
            description="As more KCL students onboard, people who share your skills and interests show up here."
            action={
              <Link
                href="/partners"
                className="border-app-ink text-app-ink border-b pb-0.5 text-sm font-medium"
              >
                Search partners
              </Link>
            }
          />
        )}
      </Section>

      <HairlineGrid className="lg:grid-cols-[1.4fr_0.6fr]">
        <div className="bg-app-paper p-6 lg:p-8">
          <BuildHeatmap events={buildEvents} />
        </div>
        <div className="bg-app-paper flex flex-col p-8">
          <p className="text-app-label text-eyebrow font-semibold tracking-eyebrow uppercase">
            Builder profile
          </p>
          <div className="mt-6 flex items-center gap-4">
            <UserRow
              fullName={user.fullName}
              username={user.username}
              imageUrl={user.imageUrl}
              role={user.role}
              meta={
                user.pronouns ? (
                  <p className="text-app-meta mt-1 font-mono text-meta tracking-meta">
                    {user.pronouns}
                  </p>
                ) : null
              }
            />
          </div>
          {[
            { label: "Skills", values: user.skills },
            { label: "Interests", values: user.interests },
          ].map((group) => (
            <div key={group.label} className="border-app-divider mt-6 border-t pt-5">
              <p className="text-app-label text-chip font-semibold tracking-chip uppercase">
                {group.label}
              </p>
              {group.values.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {group.values.slice(0, 8).map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                  {group.values.length > 8 ? (
                    <span className="text-app-meta px-1 py-1 font-mono text-chip tracking-meta">
                      +{group.values.length - 8}
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="text-app-meta mt-3 text-[13px] leading-5">
                  None captured yet.{" "}
                  <Link href="/onboarding" className="border-app-meta text-app-label border-b">
                    Add some
                  </Link>
                </p>
              )}
            </div>
          ))}
          <div className="border-app-divider mt-auto flex items-center justify-between gap-4 border-t pt-5">
            {user.githubUsername ? (
              <a
                href={`https://github.com/${user.githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="text-app-label hover:text-app-ink decoration-app-divider truncate font-mono text-meta tracking-meta underline underline-offset-2 transition-colors hover:decoration-current"
              >
                @{user.githubUsername}
              </a>
            ) : (
              <Link
                href="/onboarding"
                className="text-app-meta hover:text-app-ink font-mono text-meta tracking-meta transition-colors"
              >
                + link github
              </Link>
            )}
            {user.socialLinks.length ? (
              <span className="flex shrink-0 items-center gap-3">
                {user.socialLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-app-label hover:text-app-ink transition-colors"
                  >
                    <SocialIcon url={link} className="h-4 w-4" />
                  </a>
                ))}
              </span>
            ) : null}
          </div>
          {!user.role ? (
            <p className="text-app-meta mt-4 font-mono text-chip tracking-meta">
              Role not set · {ROLE_LABEL.BUILDER} recommended
            </p>
          ) : null}
          <p className="sr-only">{displayName(user.fullName, user.username)}</p>
        </div>
      </HairlineGrid>
    </div>
  );
}
