import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { prisma } from "@/lib/prisma";

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

  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      email,
      fullName: clerkUser?.fullName ?? null,
      username: clerkUser?.username ?? null,
      imageUrl: clerkUser?.imageUrl ?? null,
    },
  });

  if (dbUser.onboarded) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#000000] text-[#ffffff]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-8 lg:grid-cols-[18rem_1fr] lg:px-10">
        <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
          <div className="flex h-full flex-col justify-between border border-[#262626] bg-[#050505] p-5">
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em]">mebi</p>
              <p className="mt-1 text-xs text-[#d8d8d8]">Profile setup</p>
              <div className="mt-8 space-y-2 text-sm">
                {["Identity", "Skills", "Role", "Preference"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-[#d8d8d8]">
                    <span className="flex h-5 w-5 items-center justify-center rounded border border-[#333333] text-[11px]">
                      {index + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs leading-6 text-[#d8d8d8]">
              This setup turns your profile into useful matching signal for KCL project work.
            </p>
          </div>
        </aside>
        <section className="pb-16">
          <header className="border-b border-[#262626] pb-10 pt-8">
            <p className="text-[12px] font-semibold tracking-[0.3em] text-[#8f8f8f] uppercase">
              Onboarding
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.8rem,6vw,5rem)] leading-[1.02] font-light tracking-[-0.04em]">
              Create the profile your future teammates can trust.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#d8d8d8]">
              Tell us your role, skills, and interests so mebi can make project discovery feel like
              a focused workspace, not another noisy feed.
            </p>
          </header>
          <div className="mt-10">
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
