import { AppShell } from "@/components/app-shell";
import { EmptyStatePanel } from "@/components/empty-state-panel";
import { requireOnboardedUser } from "@/lib/current-user";

export default async function EventsPage() {
  await requireOnboardedUser();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="space-y-3">
          <p className="text-muted text-xs font-semibold tracking-wider uppercase">Events</p>
          <h1 className="text-4xl font-semibold tracking-tight">Society and project events</h1>
          <p className="text-muted max-w-2xl text-sm">
            Events are later-stage, but the route is present so navigation matches the intended
            product map.
          </p>
        </header>
        <EmptyStatePanel
          title="Future event layer"
          description="This can support society workshops, collaboration pitches, and launch activity later."
          points={[
            "Society-led workshops",
            "Build nights and demos",
            "Collaboration idea requests",
          ]}
        />
      </div>
    </AppShell>
  );
}
