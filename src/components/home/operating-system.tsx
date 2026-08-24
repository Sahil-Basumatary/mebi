import { KineticLine } from "@/components/home/kinetic-line";
import { cn } from "@/lib/utils";

const steps = [
  {
    index: "01",
    title: "Profile",
    body: "Skills, goals, and commitment level are captured in a structured profile that allows for meaningful matches.",
    image: "/home/os-profile.png",
    alt: "Hands on a laptop in a KCL hardware lab, with a 3D printer beside the keyboard.",
    position: "object-[50%_42%]",
    slot: "lg:col-start-1 lg:row-start-1",
    photo: "aspect-[3/2]",
  },
  {
    index: "02",
    title: "Match",
    body: "Students publish a precise request: the role they need, the project stage, and the proof they want to build.",
    image: "/home/os-match.png",
    alt: "A group of students gathered around a hardware prototype on a lab bench.",
    position: "object-[50%_40%]",
    slot: "lg:col-start-1 lg:row-start-2",
    photo: "aspect-[3/2]",
  },
  {
    index: "03",
    title: "Build",
    body: "Ownership, progress, and blockers are visible to eliminate confusion and keep teams aligned.",
    image: "/home/os-build.png",
    alt: "Two students assembling a hardware chassis at a workshop bench.",
    position: "object-[48%_35%]",
    slot: "lg:col-start-2 lg:row-start-1 lg:row-span-2",
    photo: "min-h-[22rem] flex-1 lg:min-h-0",
    tall: true,
  },
  {
    index: "04",
    title: "Prove",
    body: "Each project leaves behind a record you can pitch in a spring week, internship, or graduate interview.",
    image: "/home/os-prove.png",
    alt: "A student soldering a circuit at a workshop bench.",
    position: "object-[45%_28%]",
    slot: "lg:col-span-2",
    photo: "aspect-[2.35/1]",
    wide: true,
  },
];

export function OperatingSystem() {
  return (
    <section id="operating-system" className="bg-[#ffffff] text-[#000000]">
      <div className="mx-auto w-full max-w-[88rem] px-6 py-28 lg:px-12 lg:py-40">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <KineticLine className="flex items-end gap-7 text-[14px] leading-none font-semibold tracking-[0.3em] text-[#303030] uppercase">
            <span>The operating system</span>
            <span className="h-0.5 w-14 bg-[#000000]" />
          </KineticLine>
          <KineticLine
            as="p"
            delay={50}
            variant="headline"
            className="max-w-3xl font-serif text-[clamp(2.35rem,4.2vw,4.8rem)] leading-[1.04] font-light tracking-[-0.025em] text-[#000000]"
          >
            A single path from idea to interview-ready proof.
          </KineticLine>
        </div>
        <div className="mt-24 grid gap-8 lg:grid-cols-2 lg:gap-10">
          {steps.map((step, index) => (
            <KineticLine
              key={step.index}
              delay={index * 60}
              className={cn("flex flex-col", step.slot, step.tall && "lg:h-full")}
            >
              <article
                className={cn("border border-[#000000]", step.tall && "flex h-full flex-col")}
              >
                <div className={cn("overflow-hidden bg-[#f4f4f4]", step.photo)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={step.image}
                    alt={step.alt}
                    className={`h-full w-full object-cover ${step.position}`}
                  />
                </div>
                <div
                  className={cn(
                    "border-t border-[#000000] px-5 py-5",
                    step.wide && "lg:flex lg:items-end lg:justify-between lg:gap-12",
                  )}
                >
                  <div>
                    <p className="font-serif text-[1.35rem] leading-none font-light text-[#777777]">
                      {step.index}
                    </p>
                    <h3 className="mt-3 font-serif text-[1.85rem] leading-none font-light tracking-[-0.015em] text-[#000000]">
                      {step.title}
                    </h3>
                  </div>
                  <p
                    className={cn(
                      "mt-4 max-w-md text-[16px] leading-6 text-[#333333]",
                      step.wide && "lg:mt-0 lg:max-w-xl",
                    )}
                  >
                    {step.body}
                  </p>
                </div>
              </article>
            </KineticLine>
          ))}
        </div>
      </div>
    </section>
  );
}
