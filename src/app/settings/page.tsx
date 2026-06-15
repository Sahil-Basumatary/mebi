import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { requireOnboardedUser } from "@/lib/current-user";

export default async function SettingsPage() {
  const user = await requireOnboardedUser();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="space-y-3">
          <p className="text-muted text-xs font-semibold tracking-wider uppercase">Settings</p>
          <h1 className="text-4xl font-semibold tracking-tight">Account and profile</h1>
          <p className="text-muted max-w-2xl text-sm">
            Manage the profile details that power matching and project discovery.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Profile">
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted">Name:</span> {user.fullName || "Not set"}
              </p>
              <p>
                <span className="text-muted">Email:</span> {user.email}
              </p>
              <p>
                <span className="text-muted">Solo preference:</span>{" "}
                {user.prefersSolo ? "Solo-first" : "Open to partners"}
              </p>
              <Button asChild variant="secondary">
                <Link href="/onboarding">Edit onboarding</Link>
              </Button>
            </div>
          </Panel>

          <Panel title="Access">
            <p className="text-muted text-sm leading-relaxed">
              mebi is currently restricted to KCL email addresses through Clerk allowlist rules.
              That keeps the first launch focused and easier to moderate.
            </p>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
