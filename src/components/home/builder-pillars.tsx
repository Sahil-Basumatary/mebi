import Link from "next/link";
import { BuildMarquee } from "@/components/home/build-marquee";
import { KineticLine } from "@/components/home/kinetic-line";
import { ArrowCircle } from "@/components/ui/arrow-circle";

const pillars = [
  {
    kicker: "Growth",
    title: "Built around your development",
  },
  {
    kicker: "Trust",
    title: "Surrounded by the right people",
  },
];

export function BuilderPillars() {
  return (
    <section id="builders" className="bg-[#000000] text-[#ffffff]">
      <div className="mx-auto w-full max-w-[88rem] px-6 pt-28 pb-32 lg:px-20 lg:pt-40 lg:pb-45">
        <KineticLine className="flex items-end gap-7 text-[17px] font-medium tracking-[0.04em] text-[#ffffff] uppercase leading-none">
          <span>For builders</span>
          <span className="h-0.5 w-14 bg-[#ffffff]" />
        </KineticLine>

        <div className="mt-14 grid gap-14 lg:mt-20 lg:grid-cols-[1.03fr_1fr] lg:items-center lg:gap-14">
          <div>
            <KineticLine
              as="h2"
              variant="headline"
              className="max-w-lg font-[family-name:var(--font-newsreader)] text-[clamp(2.2rem,4vw,4.2rem)] leading-[1.05] font-light tracking-[-0.04em] text-[#ffffff]"
            >
              Exceptional career growth for individual students
            </KineticLine>
            <KineticLine
              delay={60}
              as="p"
              className="mt-8 max-w-sm text-[19px] leading-8 text-[#ffffff] lg:ml-16"
            >
              Hackollab teams partner with firms and sponsors to drive exceptional career growth for students.
            </KineticLine>
            <KineticLine delay={120} className="mt-12">
              <Link
                href="/sign-up?redirect_url=/onboarding"
                className="group inline-flex items-center gap-4 text-[18px] font-medium text-[#ffffff]"
              >
                <span>Learn More</span>
                <ArrowCircle tone="onDark" />
              </Link>
            </KineticLine>
          </div>

          <KineticLine delay={80} className="bg-[#121319] px-10 py-6 lg:px-18 lg:py-4">
            <div>
              {pillars.map((pillar, index) => (
                <div key={pillar.kicker}>
                  <button
                    type="button"
                    className="group grid w-full grid-cols-[1fr_auto] items-center gap-10 py-9 text-left"
                  >
                    <p className="max-w-[15rem] text-[22px] leading-[1.32] font-normal tracking-[-0.01em] text-[#f2f2f2] lg:text-[25px]">
                      {pillar.title}
                    </p>
                    <ArrowCircle tone="onDark" />
                  </button>
                  {index < pillars.length - 1 ? <div className="h-0.5 w-full bg-[#d8d8d8]" /> : null}
                </div>
              ))}
            </div>
          </KineticLine>
        </div>
      </div>

      <BuildMarquee className="pb-28 lg:pb-52" />
    </section>
  );
}
