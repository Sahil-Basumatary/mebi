import { AppShell } from "@/components/app-shell";
import { EmptyStatePanel } from "@/components/empty-state-panel";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/current-user";

export default async function PartnersPage() {
  await requireOnboardedUser();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="grid gap-px border border-[#d8d8d8] bg-[#d8d8d8] xl:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-[#ffffff] p-8 lg:p-10">
            <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
              Partner Intelligence
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.5rem,5vw,4.8rem)] leading-[0.98] font-light tracking-[-0.04em]">
              Find serious builders for the missing role.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#333333]">
              Partner discovery should start from a real project need, then filter by role, skills,
              interests, and proof signal.
            </p>
          </div>
          <div className="flex flex-col justify-between bg-[#f4f4f4] p-8 lg:p-10">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
                Primary action
              </p>
              <p className="mt-4 text-sm leading-6 text-[#333333]">
                Search should feel intentional: fewer random profiles, more clear matches for the
                role your project cannot cover yet.
              </p>
            </div>
            <Button disabled className="mt-8 rounded-full bg-[#000000] px-6 text-[#ffffff] hover:bg-[#333333]">
              Find partner
            </Button>
          </div>
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
