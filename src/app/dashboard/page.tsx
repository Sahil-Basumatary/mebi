import type { UserRole } from "@prisma/client";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireOnboardedUser } from "@/lib/current-user";
import { scoreMatch } from "@/lib/match";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { HeroConstellation } from "./hero-constellation";

const ROLE_LABEL: Record<UserRole, string> = {
  BUILDER: "Builder",
  SPECIALIST: "Specialist",
  LEARNER: "Learner",
};

function listPreview(values: string[], fallback: string): string {
  if (!values.length) return fallback;
  return values.slice(0, 6).join(", ");
}

function builderName(fullName: string | null, username: string | null): string {
  return fullName || username || "KCL builder";
}

function builderInitials(fullName: string | null, username: string | null): string {
  return builderName(fullName, username)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type RadarPoint = {
  label: string;
  value: number;
};

function radarCoordinate(index: number, total: number, radius: number) {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / total;
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

function pointList(points: RadarPoint[], radiusScale = 0.38): string {
  return points
    .map((point, index) => {
      const coordinate = radarCoordinate(index, points.length, radiusScale * point.value);
      return `${coordinate.x},${coordinate.y}`;
    })
    .join(" ");
}

function MatchingRadar({ points }: { points: RadarPoint[] }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[31rem]">
      <svg viewBox="-24 -22 148 146" role="img" aria-label="Matching radar profile" className="h-full w-full overflow-visible">
        {[14, 24, 34, 44].map((radius) => (
          <polygon
            key={radius}
            points={points
              .map((_, index) => {
                const coordinate = radarCoordinate(index, points.length, radius);
                return `${coordinate.x},${coordinate.y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#d8d8d8"
            strokeWidth="0.5"
          />
        ))}
        {points.map((_, index) => {
          const outer = radarCoordinate(index, points.length, 44);
          return (
            <line key={index} x1="50" y1="50" x2={outer.x} y2={outer.y} stroke="#e6e6e6" strokeWidth="0.5" />
          );
        })}
        <polygon points={pointList(points)} fill="rgba(0,0,0,0.12)" stroke="#000000" strokeWidth="0.9" />
        {points.map((point, index) => {
          const dot = radarCoordinate(index, points.length, 0.38 * point.value);
          return <circle key={point.label} cx={dot.x} cy={dot.y} r="1.15" fill="#000000" />;
        })}
        {points.map((point, index) => {
          const label = radarCoordinate(index, points.length, 52);
          const textAnchor = label.x < 40 ? "end" : label.x > 60 ? "start" : "middle";
          const yOffset = label.y < 42 ? -2 : label.y > 58 ? 5 : 0;

          return (
            <text
              key={point.label}
              x={label.x}
              y={label.y + yOffset}
              textAnchor={textAnchor}
              fill="#111111"
              fontSize="3"
              fontWeight="600"
              letterSpacing="0.1em"
            >
              <tspan x={label.x}>{point.label.toUpperCase()}</tspan>
              <tspan x={label.x} dy="4.4" fill="#555555" fontFamily="monospace" fontSize="3">
                {point.value}%
              </tspan>
            </text>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border border-[#d8d8d8] bg-[#ffffff]/90">
          <span className="font-serif text-2xl font-light">
            {Math.round(points.reduce((total, point) => total + point.value, 0) / points.length)}
          </span>
          <span className="text-[9px] font-semibold tracking-[0.16em] text-[#555555] uppercase">Score</span>
        </div>
      </div>
    </div>
  );
}

const STAGE_ICONS = [
  // Profile 
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
  // Project 
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
  // Partner
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
  //proof
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

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const [projects, activeCount, completedCount, partnerPool] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 3,
    }),
    prisma.project.count({ where: { ownerId: user.id, status: "ACTIVE" } }),
    prisma.project.count({ where: { ownerId: user.id, status: "COMPLETED" } }),
    prisma.user.findMany({
      where: { onboarded: true, id: { not: user.id } },
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
  ]);

  const overlapBuilders = partnerPool
    .map((candidate) => ({ candidate, breakdown: scoreMatch(user, candidate) }))
    .filter((entry) => entry.breakdown.score > 0)
    .sort((a, b) => b.breakdown.score - a.breakdown.score)
    .slice(0, 3);
  const activeProject = projects.find((project) => project.status === "ACTIVE") ?? projects[0];
  const hasProfileSignal = Boolean(user.bio && user.skills.length && user.interests.length);

  const nextAction = !user.bio
    ? {
        label: "Tighten profile signal",
        href: "/onboarding",
        detail: "Your profile needs serious aura improvement before you find a partner.",
      }
    : activeProject?.status === "ACTIVE"
      ? {
          label: "Review active project",
          href: `/projects/${activeProject.id}`,
          detail: "You have a live project. Move its progress before opening more discovery loops.",
        }
      : hasProfileSignal
        ? {
            label: "Review partner direction",
            href: "/partners",
            detail: "Your profile has enough signal to start naming the missing role for a serious build.",
          }
        : {
            label: "Start project brief",
            href: "/projects",
            detail: "Move from profile intent into a project brief before searching for teammates.",
          };

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
      href: "/community",
      action: "Log",
    },
  ];

  const stats = [
    { label: "Skills", value: user.skills.length },
    { label: "Interests", value: user.interests.length },
    { label: "Active", value: activeCount },
    { label: "Completed", value: completedCount },
    { label: "Requests", value: 0 },
  ];

  const radarPoints: RadarPoint[] = [
    { label: "Skills", value: user.skills.length ? 80 : 20 },
    { label: "Interests", value: user.interests.length ? 65 : 20 },
    { label: "Role", value: user.role ? 70 : 20 },
    { label: "Brief", value: activeProject ? 75 : user.bio ? 45 : 10 },
    { label: "Proof", value: completedCount ? 60 : 15 },
  ];

  const identityFacts = [
    { label: "Role", value: user.role || "Not set" },
    { label: "Skills", value: listPreview(user.skills, "None captured") },
    { label: "Interests", value: listPreview(user.interests, "None captured") },
  ];

  const rightRail = (
    <div className="flex h-full flex-col">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">Today</p>
        <h2 className="mt-4 font-serif text-3xl leading-tight font-light">Make one thing buildable.</h2>
        <p className="mt-4 text-sm leading-6 text-[#333333]">
          The best next move is not browsing. It is turning intent into a short project brief with one
          clear missing role.
        </p>
      </div>
      <div className="mt-8 border-t border-[#d8d8d8] pt-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">Calm rule</p>
        <p className="mt-3 text-sm leading-6 text-[#333333]">
          One visible next action beats ten dashboard widgets.
        </p>
      </div>
      <div className="mt-auto border-t border-[#d8d8d8] pt-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">Coming online</p>
        <p className="mt-3 text-sm leading-6 text-[#333333]">
          Teammate requests, proof artifacts, and community signal arrive once your first project is live.
        </p>
      </div>
    </div>
  );

  return (
    <AppShell rightRail={rightRail}>
      <div className="flex flex-col gap-10">
        <section className="border border-[#d8d8d8] bg-[#ffffff] p-8 lg:p-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
                Command Center
              </p>
              <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.6rem,5.5vw,5rem)] leading-[0.98] font-light tracking-[-0.04em]">
                Get your first serious project live.
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-[#333333]">
                Brief the project, find the missing partner, then capture proof. One path, one next move.
              </p>
            </div>
            <div className="relative hidden h-44 w-44 shrink-0 justify-self-end lg:block xl:h-52 xl:w-52">
              <HeroConstellation />
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-4 border-t border-[#d8d8d8] pt-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
                Recommended next
              </p>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#333333]">{nextAction.detail}</p>
            </div>
            <Link
              href={nextAction.href}
              className="group inline-flex shrink-0 items-center gap-4 text-[15px] font-medium text-[#000000]"
            >
              <span>{nextAction.label}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#000000] text-xl leading-none transition-colors group-hover:bg-[#000000] group-hover:text-[#ffffff]">
                &rarr;
              </span>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-px border border-[#d8d8d8] bg-[#d8d8d8] sm:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#ffffff] px-4 py-5">
              <p className="font-serif text-4xl leading-none font-light">{stat.value}</p>
              <p className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-[#555555] uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section className="border border-[#d8d8d8] bg-[#ffffff] p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
                Builders similar to you
              </p>
              <h2 className="mt-2 font-serif text-3xl font-light">
                {overlapBuilders.length ? "People worth reaching out to" : "Be one of the first"}
              </h2>
            </div>
            <Link
              href="/partners"
              className="shrink-0 items-center gap-1 self-start border-b border-[#000000] pb-0.5 text-sm font-medium text-[#000000] transition-opacity hover:opacity-60 sm:inline-flex sm:self-auto"
            >
              Browse all
            </Link>
          </div>
          {overlapBuilders.length ? (
            <div className="mt-6 grid gap-px bg-[#d8d8d8]">
              {overlapBuilders.map(({ candidate, breakdown }) => {
                const shared = [...breakdown.sharedSkills, ...breakdown.sharedInterests].slice(0, 4);
                return (
                  <Link
                    key={candidate.id}
                    href="/partners"
                    className="flex items-center gap-4 bg-[#ffffff] p-5 transition-colors hover:bg-[#f7f7f7]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d8d8d8] bg-[#f4f4f4] text-sm font-semibold text-[#555555]">
                      {candidate.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={candidate.imageUrl}
                          alt={builderName(candidate.fullName, candidate.username)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        builderInitials(candidate.fullName, candidate.username)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold">{builderName(candidate.fullName, candidate.username)}</p>
                        {candidate.role ? (
                          <span className="border border-[#d8d8d8] bg-[#f4f4f4] px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-[#555555] uppercase">
                            {ROLE_LABEL[candidate.role]}
                          </span>
                        ) : null}
                      </div>
                      {shared.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {shared.map((tag) => (
                            <span
                              key={tag}
                              className="border border-[#000000] bg-[#000000] px-2 py-0.5 text-[11px] text-[#ffffff]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <span className="hidden shrink-0 font-mono text-[11px] tracking-[0.16em] text-[#555555] sm:inline">
                      {breakdown.sharedSkills.length + breakdown.sharedInterests.length} SHARED
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 border border-[#d8d8d8] bg-[#f7f7f7] p-5">
              <p className="text-sm leading-6 text-[#333333]">
                No overlapping builders yet. As more KCL students onboard, the people who share your skills and
                interests show up here.{" "}
                <Link href="/partners" className="border-b border-[#000000] font-medium text-[#000000]">
                  Search partners
                </Link>
                .
              </p>
            </div>
          )}
        </section>

        <section className="border border-[#d8d8d8] bg-[#ffffff] p-6 lg:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">Build path</p>
              <h2 className="mt-2 font-serif text-3xl font-light">Four checkpoints</h2>
            </div>
            <span className="hidden font-mono text-[11px] tracking-[0.16em] text-[#555555] sm:inline">
              PROFILE → PROJECT → PARTNER → PROOF
            </span>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {buildPath.map((stage, index) => (
              <div
                key={stage.label}
                className="group/step flex flex-col border border-[#d8d8d8] bg-[#ffffff] transition-all duration-200 hover:-translate-y-1 hover:border-[#111111] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)]"
              >
                <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#000000]">
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-12 w-12 text-[#ffffff] transition-transform duration-200 group-hover/step:scale-110">
                      {STAGE_ICONS[index]}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "absolute top-3 left-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm",
                      stage.done
                        ? "bg-[#ffffff] text-[#000000]"
                        : "border border-[#666666] bg-transparent text-[#ffffff]",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="absolute top-4 right-3 font-mono text-[10px] tracking-[0.16em] text-[#bbbbbb]">
                    {stage.done ? "DONE" : "OPEN"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <p className="font-semibold">{stage.label}</p>
                    <p className="mt-1 text-sm text-[#333333]">{stage.status}</p>
                  </div>
                  <Link
                    href={stage.href}
                    className="mt-auto inline-flex w-fit items-center gap-1 border-b border-[#000000] pb-0.5 text-sm font-medium text-[#000000] transition-opacity hover:opacity-60"
                  >
                    {stage.action}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-[#d8d8d8] bg-[#ffffff] p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
                Active build records
              </p>
              <h2 className="mt-2 font-serif text-3xl font-light">What you are shipping</h2>
            </div>
            <Link
              href="/projects"
              className="shrink-0 items-center gap-1 self-start border-b border-[#000000] pb-0.5 text-sm font-medium text-[#000000] transition-opacity hover:opacity-60 sm:inline-flex sm:self-auto"
            >
              Open pipeline
            </Link>
          </div>
          {projects.length ? (
            <div className="mt-6 grid gap-px bg-[#d8d8d8]">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="grid gap-4 bg-[#ffffff] p-5 transition-colors hover:bg-[#f7f7f7] md:grid-cols-[1fr_10rem] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold">{project.name}</p>
                      <span className="border border-[#d8d8d8] bg-[#f4f4f4] px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#555555] uppercase">
                        {project.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 text-sm text-[#333333]">{project.description}</p>
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
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 border border-[#d8d8d8] bg-[#f7f7f7] p-5">
              <p className="text-sm leading-6 text-[#333333]">
                No project records yet. Create the first brief in Project Pipeline so partner matching has
                something concrete to reason about.
              </p>
            </div>
          )}
        </section>

        <section className="grid gap-px border border-[#d8d8d8] bg-[#d8d8d8] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-[#ffffff] p-8">
            <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">Matching radar</p>
            <div className="mt-8 flex justify-center">
              <MatchingRadar points={radarPoints} />
            </div>
          </div>
          <div className="flex flex-col bg-[#ffffff] p-8">
            <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">Your abilities</p>
            <h2 className="mt-2 font-serif text-3xl font-light">What the radar means</h2>
            <dl className="mt-8 divide-y divide-[#d8d8d8] border-y border-[#d8d8d8]">
              {identityFacts.map((fact) => (
                <div key={fact.label} className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-4">
                  <dt className="text-[11px] font-semibold tracking-[0.18em] text-[#555555] uppercase">
                    {fact.label}
                  </dt>
                  <dd className="text-sm leading-6 text-[#222222]">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-auto pt-6 text-sm leading-6 text-[#333333]">
              The shape sharpens when your project brief names a specific missing role. Skills and
              interests widen the base; proof lifts the top edge.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
