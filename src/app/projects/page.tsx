import { AppShell } from "@/components/app-shell";
import { EmptyStatePanel } from "@/components/empty-state-panel";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/current-user";

export default async function ProjectsPage() {
  await requireOnboardedUser();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-muted text-xs font-semibold tracking-wider uppercase">Projects</p>
            <h1 className="text-4xl font-semibold tracking-tight">Your project workspace</h1>
            <p className="text-muted max-w-2xl text-sm">
              This will become the place to create public or private projects, invite partners, and
              track progress.
            </p>
          </div>
          <Button disabled>Create project</Button>
        </header>
        <EmptyStatePanel
          title="Coming next"
          description="M6 sets the shell and route structure. Project creation will follow as a focused data-model milestone."
          points={[
            "Project idea, outcomes, tags, and visibility",
            "Solo or partnered status",
            "Progress tracking and completion state",
          ]}
        />
      </div>
    </AppShell>
  );
}
