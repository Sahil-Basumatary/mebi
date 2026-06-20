import { HomeHero } from "@/components/home/home-hero";
import { BuilderPillars } from "@/components/home/builder-pillars";
import { FeaturedStories } from "@/components/home/featured-stories";
import { NewsletterSignup } from "@/components/home/newsletter-signup";
import { OperatingSystem } from "@/components/home/operating-system";
import { ScaleBand } from "@/components/home/scale-band";

export default function Home() {
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
