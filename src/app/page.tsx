import { auth } from "@clerk/nextjs/server";
import { Newsreader } from "next/font/google";
import { redirect } from "next/navigation";
import { HomeHero } from "@/components/home/home-hero";
import { BuilderPillars } from "@/components/home/builder-pillars";
import { FeaturedStories } from "@/components/home/featured-stories";
import { NewsletterSignup } from "@/components/home/newsletter-signup";
import { OperatingSystem } from "@/components/home/operating-system";
import { ScaleBand } from "@/components/home/scale-band";
import { SkipLink } from "@/components/layout/skip-link";
import { SiteFooter } from "@/components/site-footer";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-newsreader",
  display: "swap",
});

export default async function Home() {
  // Signed-in visits to `/` should resume via Open on start, not the marketing page.
  const { userId } = await auth();
  if (userId) {
    redirect("/start");
  }

  return (
    <>
      <SkipLink className="skip-link-marketing" />
      <main
        id="main-content"
        tabIndex={-1}
        className={`${newsreader.variable} marketing min-h-screen bg-[#000000] text-[#ffffff] outline-none`}
      >
        <HomeHero />
        <ScaleBand />
        <BuilderPillars />
        <OperatingSystem />
        <FeaturedStories />
        <NewsletterSignup />
      </main>
      <SiteFooter variant="marketing" />
    </>
  );
}
