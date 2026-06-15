import { AppShell } from "@/components/app-shell";
import { EmptyStatePanel } from "@/components/empty-state-panel";
import { requireOnboardedUser } from "@/lib/current-user";

export default async function CommunityPage() {
  await requireOnboardedUser();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="space-y-3">
          <p className="text-muted text-xs font-semibold tracking-wider uppercase">Community</p>
          <h1 className="text-4xl font-semibold tracking-tight">Get feedback without noise</h1>
          <p className="text-muted max-w-2xl text-sm">
            This will become a focused place for project questions, feedback templates, and useful
            student-led discussion.
          </p>
        </header>
        <EmptyStatePanel
          title="Structured discussion"
          description="We are keeping this page deliberately narrow so it does not become another noisy group chat."
          points={[
            "Project feedback threads",
            "Technical questions with tags",
            "Moderator-friendly templates",
          ]}
        />
      </div>
    </AppShell>
  );
}
