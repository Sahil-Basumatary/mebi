import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { requireOnboardedUser } from "@/lib/current-user";

function roleLabel(role: string | null): string {
  if (role === "BUILDER") return "Builder";
  if (role === "SPECIALIST") return "Specialist";
  if (role === "LEARNER") return "Learner";
  return "Not set";
}

export default async function DashboardPage() {
  const user = await requireOnboardedUser();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-muted text-xs font-semibold tracking-wider uppercase">Dashboard</p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Welcome{user.fullName ? `, ${user.fullName}` : ""}
            </h1>
            <p className="text-muted max-w-2xl text-sm">
              Start a project, browse reliable partners, or tighten your profile so matching gets
              better over time.
            </p>
          </div>
          <Button asChild>
            <Link href="/projects">Create project</Link>
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Panel title="Role">
            <p className="text-2xl font-semibold">{roleLabel(user.role)}</p>
            <p className="text-muted mt-2 text-sm">
              Used to shape partner suggestions and beginner-friendly flows.
            </p>
          </Panel>
          <Panel title="Skills">
            <p className="text-2xl font-semibold">{user.skills.length}</p>
            <p className="text-muted mt-2 text-sm">
              {user.skills.length ? user.skills.slice(0, 4).join(", ") : "Add skills to improve matches."}
            </p>
          </Panel>
          <Panel title="Projects">
            <p className="text-2xl font-semibold">0</p>
            <p className="text-muted mt-2 text-sm">Project creation lands next, with progress tracking.</p>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Next best actions">
            <div className="flex flex-col gap-3">
              <div className="rounded-md border border-border bg-raised p-4">
                <p className="text-sm font-semibold">Create your first public project idea</p>
                <p className="text-muted mt-1 text-sm">
                  Listings make it easier for serious students to understand what you want to build.
                </p>
              </div>
              <div className="rounded-md border border-border bg-raised p-4">
                <p className="text-sm font-semibold">Browse partner profiles</p>
                <p className="text-muted mt-1 text-sm">
                  Start with overlapping skills or interests, then send a structured request.
                </p>
              </div>
              <div className="rounded-md border border-border bg-raised p-4">
                <p className="text-sm font-semibold">Complete profile details</p>
                <p className="text-muted mt-1 text-sm">
                  Your bio and tags become the matching surface for M7 partner discovery.
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Profile snapshot">
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted text-xs font-semibold tracking-wider uppercase">Bio</p>
                <p className="mt-1">{user.bio || "No bio yet."}</p>
              </div>
              <div>
                <p className="text-muted text-xs font-semibold tracking-wider uppercase">Interests</p>
                <p className="mt-1">
                  {user.interests.length ? user.interests.join(", ") : "No interests yet."}
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link href="/onboarding">Edit onboarding</Link>
              </Button>
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  );
}
