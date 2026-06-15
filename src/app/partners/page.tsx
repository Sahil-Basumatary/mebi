import { AppShell } from "@/components/app-shell";
import { EmptyStatePanel } from "@/components/empty-state-panel";
import { requireOnboardedUser } from "@/lib/current-user";

export default async function PartnersPage() {
  await requireOnboardedUser();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="space-y-3">
          <p className="text-muted text-xs font-semibold tracking-wider uppercase">Browse partners</p>
          <h1 className="text-4xl font-semibold tracking-tight">Find serious builders</h1>
          <p className="text-muted max-w-2xl text-sm">
            Partner discovery will use role, skills, and interests from onboarding before adding
            richer filters.
          </p>
        </header>
        <EmptyStatePanel
          title="Matching surface"
          description="This page is intentionally empty until we add searchable profiles and request flows."
          points={[
            "Filter by skills, interests, and role",
            "Show close matches when exact matches are missing",
            "Send structured partnership requests",
          ]}
        />
      </div>
    </AppShell>
  );
}
