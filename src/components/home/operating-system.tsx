import { KineticLine } from "@/components/home/kinetic-line";

const steps = [
  {
    index: "01",
    title: "Profile",
    body: "Skills, goals, and commitment level are captured in a structured profile that allows for meaningful matches.",
  },
  {
    index: "02",
    title: "Match",
    body: "Students publish a precise request: the role they need, the project stage, and the proof they want to build.",
  },
  {
    index: "03",
    title: "Build",
    body: "Ownership, progress, and blockers is visible to eliminate confusion and keep teams aligned.",
  },
  {
    index: "04",
    title: "Prove",
    body: "Each project leaves behind a record you can pitch in a spring week, internship, or graduate interview.",
  },
];

export function OperatingSystem() {
  return (
    <section id="operating-system" className="bg-[#ffffff] text-[#000000]">
      <div className="mx-auto w-full max-w-[88rem] px-6 py-28 lg:px-12 lg:py-40">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <KineticLine className="flex items-end gap-7 text-[14px] font-semibold tracking-[0.3em] text-[#303030] uppercase leading-none">
            <span>The operating system</span>
            <span className="h-0.5 w-14 bg-[#000000]" />
          </KineticLine>
          <KineticLine
            as="p"
            delay={50}
            variant="headline"
            className="max-w-3xl font-[family-name:var(--font-newsreader)] text-[clamp(2.35rem,4.2vw,4.8rem)] leading-[1.04] font-light tracking-[-0.025em] text-[#000000]"
          >
            A single path from idea to interview-ready proof.
          </KineticLine>
        </div>
        <div className="mt-24 grid gap-px overflow-hidden border border-[#d8d8d8] bg-[#d8d8d8] md:grid-cols-2">
          {steps.map((step, index) => (
            <KineticLine
              key={step.index}
              delay={index * 60}
              className="group flex min-h-[19rem] flex-col justify-between bg-[#ffffff] p-9 transition-colors hover:bg-[#f4f4f4] lg:p-11"
            >
              <span className="font-[family-name:var(--font-newsreader)] text-[2rem] leading-none font-light text-[#777777]">
                {step.index}
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-newsreader)] text-[2.2rem] font-light tracking-[-0.015em] text-[#000000]">
                  {step.title}
                </h3>
                <p className="mt-5 max-w-md font-normal text-[17px] leading-7 text-[#333333]">{step.body}</p>
              </div>
            </KineticLine>
          ))}
        </div>
      </div>
    </section>
  );
}
