import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

function listPreview(values: string[], fallback: string): string {
  if (!values.length) return fallback;
  return values.slice(0, 4).join(", ");
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="relative flex h-40 w-40 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#000000 ${value * 3.6}deg, #d8d8d8 0deg)`,
      }}
    >
      <div className="flex h-[7.6rem] w-[7.6rem] flex-col items-center justify-center rounded-full bg-[#ffffff] text-center">
        <span className="font-serif text-4xl font-light">{value}%</span>
        <span className="mt-1 max-w-20 text-[10px] font-semibold tracking-[0.16em] text-[#555555] uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold tracking-[0.16em] text-[#555555] uppercase">{label}</span>
        <span className="text-[#333333]">{value}%</span>
      </div>
      <div className="h-2 bg-[#d8d8d8]">
        <div className="h-full bg-[#000000]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
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
            <line
              key={index}
              x1="50"
              y1="50"
              x2={outer.x}
              y2={outer.y}
              stroke="#e6e6e6"
              strokeWidth="0.5"
            />
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
          <span className="font-serif text-2xl font-light">{Math.round(points.reduce((total, point) => total + point.value, 0) / points.length)}</span>
          <span className="text-[9px] font-semibold tracking-[0.16em] text-[#555555] uppercase">Score</span>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 3,
  });
  const activeProject = projects.find((project) => project.status === "ACTIVE") ?? projects[0];
  const skillsPreview = listPreview(user.skills, "No skills captured");
  const pipelineRows = [
    {
      stage: "Idea intake",
      status: user.bio ? "Profile signal present" : "Missing project thesis",
      owner: "You",
      signal: user.bio || "Write the one-line problem you want to solve.",
      action: "Tighten brief",
    },
    {
      stage: "Partner search",
      status: user.skills.length ? "Searchable skills online" : "Skills not indexed",
      owner: "mebi",
      signal: skillsPreview,
      action: "Find gaps",
    },
    {
      stage: "Build sprint",
      status: activeProject ? `${activeProject.progress}% complete` : "No active sprint",
      owner: "Team",
      signal: activeProject?.name ?? "Project model not created yet",
      action: activeProject ? "Review project" : "Create project",
    },
    {
      stage: "Proof capture",
      status: "No evidence logged",
      owner: "Portfolio",
      signal: "Decisions, contribution, metric, artifact",
      action: "Log proof",
    },
  ];
  const actionTape = [
    ["1", "Write a project brief", "Turn your current interests into a buildable request."],
    ["2", "Name the missing role", "Decide whether you need backend, design, data, or product help."],
    ["3", "Create proof checklist", "Define the evidence you want to show in interviews."],
  ];
  const timeline = [
    { label: "Profile", detail: "Live", active: true },
    { label: "Project", detail: activeProject ? "Live" : "Next", active: Boolean(activeProject) },
    { label: "Partner", detail: "Waiting", active: false },
    { label: "Proof", detail: activeProject?.status === "COMPLETED" ? "Ready" : "Waiting", active: activeProject?.status === "COMPLETED" },
  ];
  const readiness = Math.round((1 + Number(user.skills.length > 0) + Number(user.interests.length > 0)) * 12.5);
  const hasProfileSignal = Boolean(user.bio && user.skills.length && user.interests.length);
  const nextAction = !user.bio
    ? {
        eyebrow: "Recommended next",
        label: "Tighten profile signal",
        href: "/onboarding",
        detail: "Your profile needs a sharper problem signal before project and partner flows can work well.",
      }
    : activeProject?.status === "ACTIVE"
      ? {
          eyebrow: "Recommended next",
          label: "Review active project",
          href: `/projects/${activeProject.id}`,
          detail: "You have a live project. Update progress before opening more discovery loops.",
        }
    : hasProfileSignal
      ? {
          eyebrow: "Recommended next",
          label: "Review partner direction",
          href: "/partners",
          detail: "Your profile has enough signal to start thinking about the missing role for a serious build.",
        }
      : {
          eyebrow: "Recommended next",
          label: "Start project brief",
          href: "/projects",
          detail: "Move from profile intent into a project brief before searching for teammates.",
        };
  const radarPoints = [
    { label: "Skills", value: user.skills.length ? 80 : 20 },
    { label: "Interests", value: user.interests.length ? 65 : 20 },
    { label: "Role", value: user.role ? 70 : 20 },
    { label: "Brief", value: activeProject ? 75 : user.bio ? 45 : 10 },
    { label: "Proof", value: activeProject?.status === "COMPLETED" ? 60 : 15 },
  ];
  const rightRail = (
    <div className="flex h-full flex-col">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
          Today
        </p>
        <h2 className="mt-4 font-serif text-3xl leading-tight font-light">Make one thing buildable.</h2>
        <p className="mt-4 text-sm leading-6 text-[#333333]">
          The best next move is not browsing. It is turning your intent into a short project brief
          with one clear missing role.
        </p>
      </div>
      <div className="mt-8 border-y border-[#d8d8d8] py-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
          Matching radar
        </p>
        <div className="mt-5 space-y-4">
          <Meter label="Skill signal" value={user.skills.length ? 80 : 25} />
          <Meter label="Role clarity" value={user.role ? 70 : 20} />
          <Meter label="Project brief" value={user.bio ? 45 : 10} />
        </div>
      </div>
      <div className="mt-6">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
          Calm rule
        </p>
        <p className="mt-3 text-sm leading-6 text-[#333333]">
          One visible next action beats ten possible dashboard widgets.
        </p>
      </div>
      <div className="mt-auto border-t border-[#d8d8d8] pt-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
          Not started yet
        </p>
        <p className="mt-3 text-sm leading-6 text-[#333333]">Project record, teammate requests, proof artifacts.</p>
      </div>
    </div>
  );

  return (
    <AppShell rightRail={rightRail}>
      <div className="flex flex-col gap-10">
        <section className="grid gap-px border border-[#d8d8d8] bg-[#d8d8d8] xl:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-[#ffffff] p-8 lg:p-10">
            <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
              Command Center
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.98] font-light tracking-[-0.04em]">
              Get your first serious project live.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#333333]">
              Your profile is the starting signal. The cockpit now focuses on one user-friendly
              journey: brief the project, find the missing partner, then capture proof.
            </p>
            <div className="mt-8 max-w-xl border border-[#d8d8d8] bg-[#f7f7f7] p-5">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
                {nextAction.eyebrow}
              </p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-sm text-sm leading-6 text-[#333333]">{nextAction.detail}</p>
                <Button asChild className="shrink-0 rounded-full bg-[#000000] px-6 text-[#ffffff] hover:bg-[#333333]">
                  <Link href={nextAction.href}>{nextAction.label}</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-[#f4f4f4] p-8 lg:p-10">
            <ProgressRing value={readiness} label="Ready" />
            <p className="mt-6 text-center text-sm leading-6 text-[#333333]">
              Profile signal is live. Project, partner, and proof are the next layers.
            </p>
          </div>
        </section>

        <section className="border border-[#d8d8d8] bg-[#ffffff] p-6">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
              Next actions
            </p>
            <span className="text-sm text-[#333333]">Start here</span>
          </div>
          <div className="mt-5 grid gap-px bg-[#d8d8d8] md:grid-cols-3">
            {actionTape.map(([step, title, detail]) => (
              <div key={step} className="bg-[#ffffff] p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#000000] text-sm text-[#ffffff]">
                  {step}
                </span>
                <p className="mt-5 font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[#333333]">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-[#d8d8d8] bg-[#ffffff] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
                Project pipeline
              </p>
              <h2 className="mt-2 font-serif text-3xl font-light">Active build records</h2>
            </div>
            <Button asChild variant="secondary" className="rounded-full border-[#d8d8d8] bg-[#ffffff] px-5 text-[#000000] hover:bg-[#f4f4f4]">
              <Link href="/projects">Open pipeline</Link>
            </Button>
          </div>
          {projects.length ? (
            <div className="mt-6 grid gap-px bg-[#d8d8d8]">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="grid gap-4 bg-[#ffffff] p-5 transition-colors hover:bg-[#f7f7f7] md:grid-cols-[1fr_10rem] md:items-center">
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

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="border border-[#d8d8d8] bg-[#ffffff] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
                  Project journey
                </p>
                <h2 className="mt-2 font-serif text-3xl font-light">One path, four checkpoints</h2>
              </div>
              <span className="hidden text-sm text-[#333333] sm:inline">Visual pipeline</span>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {timeline.map((stage, index) => (
                <div key={stage.label} className="relative">
                  {index < timeline.length - 1 ? (
                    <div className="absolute left-8 top-8 hidden h-px w-[calc(100%+1rem)] bg-[#d8d8d8] md:block" />
                  ) : null}
                  <div className="relative z-10 flex h-full flex-col gap-4 border border-[#d8d8d8] bg-[#ffffff] p-4">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${
                        stage.active
                          ? "border-[#000000] bg-[#000000] text-[#ffffff]"
                          : "border-[#d8d8d8] bg-[#f4f4f4] text-[#333333]"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{stage.label}</p>
                      <p className="mt-1 text-sm text-[#333333]">{stage.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#d8d8d8] bg-[#ffffff] p-8">
            <p className="text-center text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
              Matching radar
            </p>
            <div className="mt-8 flex justify-center">
              <MatchingRadar points={radarPoints} />
            </div>
            <p className="mx-auto mt-6 max-w-md text-center text-sm leading-6 text-[#333333]">
              Radar improves when your project brief names a specific missing role.
            </p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
                Diagnostic ledger
              </p>
              <h2 className="mt-2 font-serif text-3xl font-light">Deeper operating detail</h2>
            </div>
            <p className="font-mono text-[11px] tracking-[0.16em] text-[#555555]">ADVANCED</p>
          </div>
          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-[#f4f4f4] text-[11px] tracking-[0.2em] text-[#555555] uppercase">
                <tr>
                  <th className="border-b border-[#d8d8d8] px-4 py-3 font-semibold">Stage</th>
                  <th className="border-b border-[#d8d8d8] px-4 py-3 font-semibold">Status</th>
                  <th className="border-b border-[#d8d8d8] px-4 py-3 font-semibold">Owner</th>
                  <th className="border-b border-[#d8d8d8] px-4 py-3 font-semibold">Signal</th>
                  <th className="border-b border-[#d8d8d8] px-4 py-3 font-semibold">Next action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8d8d8] bg-[#ffffff]">
                {pipelineRows.map((row) => (
                  <tr key={row.stage}>
                    <td className="px-4 py-4 font-semibold">{row.stage}</td>
                    <td className="px-4 py-4 text-[#333333]">{row.status}</td>
                    <td className="px-4 py-4 text-[#333333]">{row.owner}</td>
                    <td className="max-w-sm px-4 py-4 text-[#333333]">{row.signal}</td>
                    <td className="px-4 py-4">
                      <span className="border border-[#d8d8d8] bg-[#f4f4f4] px-2 py-1 text-xs">
                        {row.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
