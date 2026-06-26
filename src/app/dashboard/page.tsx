import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

function listPreview(values: string[], fallback: string): string {
  if (!values.length) return fallback;
  return values.slice(0, 6).join(", ");
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

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const [projects, activeCount, completedCount] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 3,
    }),
    prisma.project.count({ where: { ownerId: user.id, status: "ACTIVE" } }),
    prisma.project.count({ where: { ownerId: user.id, status: "COMPLETED" } }),
  ]);
  const activeProject = projects.find((project) => project.status === "ACTIVE") ?? projects[0];
  const hasProfileSignal = Boolean(user.bio && user.skills.length && user.interests.length);

  // One adaptive next move. The whole page points at exactly this, so it never
  // competes with a second "do this" block elsewhere.
  const nextAction = !user.bio
    ? {
        label: "Tighten profile signal",
        href: "/onboarding",
        detail: "Your profile needs a sharper problem signal before project and partner flows work well.",
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

  // Single source of truth for "where am I" — replaces the old journey timeline,
  // diagnostic ledger, and next-actions tape, which all said this three ways.
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

  // Flat count strip (GitHub profile style), not cards: pure at-a-glance numbers.
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
          <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">Command Center</p>
          <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.6rem,5.5vw,5rem)] leading-[0.98] font-light tracking-[-0.04em]">
            Get your first serious project live.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#333333]">
            Brief the project, find the missing partner, then capture proof. One path, one next move.
          </p>
          <div className="mt-8 flex max-w-2xl flex-col gap-4 border-t border-[#d8d8d8] pt-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
                Recommended next
              </p>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#333333]">{nextAction.detail}</p>
            </div>
            <Button asChild className="shrink-0 rounded-full bg-[#000000] px-6 text-[#ffffff] hover:bg-[#333333]">
              <Link href={nextAction.href}>{nextAction.label}</Link>
            </Button>
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
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">Build path</p>
              <h2 className="mt-2 font-serif text-3xl font-light">Four checkpoints, one route</h2>
            </div>
            <span className="hidden font-mono text-[11px] tracking-[0.16em] text-[#555555] sm:inline">
              PROFILE → PROJECT → PARTNER → PROOF
            </span>
          </div>
          <div className="mt-8 grid gap-px bg-[#d8d8d8] md:grid-cols-4">
            {buildPath.map((stage, index) => (
              <div key={stage.label} className="flex flex-col gap-5 bg-[#ffffff] p-5">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                      stage.done
                        ? "bg-[#000000] text-[#ffffff]"
                        : "border border-[#d8d8d8] bg-[#f4f4f4] text-[#333333]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.16em] text-[#999999]">
                    {stage.done ? "DONE" : "OPEN"}
                  </span>
                </div>
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
            <Button
              asChild
              variant="secondary"
              className="rounded-full border-[#d8d8d8] bg-[#ffffff] px-5 text-[#000000] hover:bg-[#f4f4f4]"
            >
              <Link href="/projects">Open pipeline</Link>
            </Button>
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
            <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">Your signal</p>
            <h2 className="mt-2 font-serif text-3xl font-light">What the radar reads</h2>
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
