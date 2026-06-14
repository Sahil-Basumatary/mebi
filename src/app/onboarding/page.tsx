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
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-14">
      <header className="space-y-3">
        <p className="text-muted text-xs font-semibold tracking-wider uppercase">M5 Onboarding</p>
        <h1 className="text-4xl font-semibold tracking-tight">Create your mebi profile</h1>
        <p className="text-muted max-w-2xl text-sm">
          Tell us your role, skills, and interests so we can match you with the right people and
          projects.
        </p>
      </header>

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
    </main>
  );
}
