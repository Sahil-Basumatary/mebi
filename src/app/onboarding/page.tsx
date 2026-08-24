import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { SkipLink } from "@/components/layout/skip-link";
import { ensureUserFromClerk } from "@/lib/ensure-user";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase() ??
    clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (!email) {
    redirect("/sign-in");
  }

  const dbUser = await ensureUserFromClerk({
    clerkId: userId,
    email,
    fullName: clerkUser?.fullName ?? null,
    imageUrl: clerkUser?.imageUrl ?? null,
  });

  if (dbUser.onboarded) {
    redirect("/home");
  }

  return (
    <main className="bg-app-canvas text-app-ink min-h-screen">
      <SkipLink />
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[16rem_1fr] lg:px-10">
        <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
          <div className="border-app-divider bg-app-paper flex h-full flex-col justify-between border p-5">
            <div>
              <BrandMark className="h-7" />
              <p className="text-app-meta mt-2 text-xs">Profile setup</p>
              <ol className="mt-8 space-y-2 text-sm">
                {["Identity", "Skills", "Role", "Preference"].map((item, index) => (
                  <li key={item} className="text-app-body flex items-center gap-3 px-1 py-1">
                    <span className="border-app-divider text-app-meta flex h-5 w-5 items-center justify-center border text-[11px]">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-app-meta text-xs leading-5">
              These fields power matching and your public profile.
            </p>
          </div>
        </aside>
        <section className="pb-16">
          <header className="border-app-divider bg-app-paper border px-5 py-5">
            <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
              Onboarding
            </p>
            <h1 className="text-app-ink mt-2 text-4xl leading-tight font-medium sm:text-5xl">
              Set up your builder profile
            </h1>
            <p className="text-app-body mt-3 max-w-2xl text-sm leading-6">
              Role, skills, and interests are used to match you with projects and teammates.
            </p>
          </header>
          <div className="mt-6">
            <OnboardingForm
              initialValues={{
                fullName: dbUser.fullName ?? clerkUser?.fullName ?? "",
                username: dbUser.username ?? clerkUser?.username ?? "",
                bio: dbUser.bio ?? "",
                imageUrl: dbUser.imageUrl ?? clerkUser?.imageUrl ?? "",
                skills: dbUser.skills.join(", "),
                interests: dbUser.interests.join(", "),
                role: dbUser.role ?? "",
                prefersSolo: dbUser.prefersSolo,
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
