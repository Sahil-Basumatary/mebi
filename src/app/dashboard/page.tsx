import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user || !user.onboarded) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-muted text-xs font-semibold tracking-wider uppercase">Dashboard</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Welcome{user.fullName ? `, ${user.fullName}` : ""}
        </h1>
        <p className="text-muted text-sm">
          M5 is complete: your onboarding profile is saved and this is now your authenticated home.
        </p>
      </header>
      <div className="flex gap-3">
        <Button asChild variant="secondary">
          <Link href="/onboarding">Edit onboarding</Link>
        </Button>
      </div>
    </main>
  );
}
