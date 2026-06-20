import { KineticLine } from "@/components/home/kinetic-line";

const pillars = [
  {
    kicker: "Growth",
    title: "Built around your development",
    body: "Every project is framed as a chance to learn in public, take ownership, and grow faster than a solo side-project ever allows.",
  },
  {
    kicker: "Structure",
    title: "Led by the work itself",
    body: "Roles, requests, and progress are explicit, so momentum comes from clear structure rather than someone constantly chasing the group.",
  },
  {
    kicker: "Trust",
    title: "Surrounded by the right people",
    body: "A KCL-only network means you build alongside students who are accountable, serious, and genuinely invested in shipping.",
  },
];

export function BuilderPillars() {
  return (
    <section id="builders" className="bg-[#000000] text-[#ffffff]">
      <div className="mx-auto w-full max-w-[88rem] divide-y divide-[#262626] px-6 lg:px-12">
        {pillars.map((pillar, index) => (
          <KineticLine
            key={pillar.kicker}
            delay={index * 60}
            className="grid gap-12 py-24 md:grid-cols-[0.42fr_1.58fr] lg:py-32"
          >
            <div className="flex items-center gap-7 self-start pt-2">
              <p className="text-[12px] font-semibold tracking-[0.3em] text-[#d8d8d8] uppercase">
                {pillar.kicker}
              </p>
              <span className="h-px w-14 bg-[#d8d8d8]" />
            </div>
            <div>
              <KineticLine
                as="h3"
                delay={index * 60 + 40}
                variant="headline"
                className="max-w-3xl font-[family-name:var(--font-newsreader)] text-[clamp(2.2rem,4vw,4.8rem)] leading-[1.04] font-light tracking-[-0.025em] text-[#ffffff]"
              >
                {pillar.title}
              </KineticLine>
              <p className="mt-10 max-w-xl text-[16px] leading-8 text-[#d8d8d8]">{pillar.body}</p>
            </div>
          </KineticLine>
        ))}
      </div>
    </section>
  );
}
