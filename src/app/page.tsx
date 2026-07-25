import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HomeHero } from "@/components/home/home-hero";
import { BuilderPillars } from "@/components/home/builder-pillars";
import { FeaturedStories } from "@/components/home/featured-stories";
import { NewsletterSignup } from "@/components/home/newsletter-signup";
import { OperatingSystem } from "@/components/home/operating-system";
import { ScaleBand } from "@/components/home/scale-band";

export default async function Home() {
  // Signed-in visits to `/` should resume via Open on start, not the marketing page.
  const { userId } = await auth();
  if (userId) {
    redirect("/start");
  }

  return (
    <main className="min-h-screen bg-[#000000] text-[#ffffff]">
      <HomeHero />
      <ScaleBand />
      <BuilderPillars />
      <OperatingSystem />
      <FeaturedStories />
      <NewsletterSignup />
    </main>
  );
}
