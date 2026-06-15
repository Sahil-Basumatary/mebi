import { AppShell } from "@/components/app-shell";
import { EmptyStatePanel } from "@/components/empty-state-panel";
import { requireOnboardedUser } from "@/lib/current-user";

export default async function InboxPage() {
  await requireOnboardedUser();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="space-y-3">
          <p className="text-muted text-xs font-semibold tracking-wider uppercase">Inbox</p>
          <h1 className="text-4xl font-semibold tracking-tight">Requests and notifications</h1>
          <p className="text-muted max-w-2xl text-sm">
            Partnership requests, project invites, and reminders will live here once messaging is
            introduced.
          </p>
        </header>
        <EmptyStatePanel
          title="No messages yet"
          description="The inbox is ready as a destination before request data exists."
          points={[
            "Partnership requests",
            "Project invitations",
            "Progress reminders and system notices",
          ]}
        />
      </div>
    </AppShell>
  );
}
