import { KineticLine } from "@/components/home/kinetic-line";

const tiles = [
  {
    value: "1",
    unit: "University",
    body: "KCL-only access keeps the network accountable and the trust boundary tight from day one.",
  },
  {
    value: "3",
    unit: "Roles",
    body: "Builder, specialist, and learner are separated so ambition level is never mistaken.",
  },
  {
    value: "0",
    unit: "Noise",
    body: "Structured requests replace the endless scroll of unanswered group-chat messages.",
  },
];

export function ScaleBand() {
  return (
    <section id="network" className="bg-[#ffffff] text-[#000000]">
      <div className="mx-auto w-full max-w-[88rem] px-6 py-28 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto h-px w-16 bg-[#000000]" />
          <KineticLine
            delay={40}
            className="mt-8 text-[12px] font-semibold tracking-[0.3em] text-[#303030] uppercase"
          >
            About the network
          </KineticLine>
          <KineticLine
            delay={70}
            variant="headline"
            className="mt-12 font-[family-name:var(--font-newsreader)] text-[clamp(2.25rem,4vw,4rem)] leading-[1.08] font-light tracking-[-0.02em]"
          >
            mebi gives student builders the structure that serious work quietly depends on.
          </KineticLine>
        </div>
        <div className="mt-24 grid gap-px overflow-hidden border border-[#d8d8d8] bg-[#d8d8d8] md:grid-cols-3">
          {tiles.map((tile, index) => (
            <KineticLine
              key={tile.unit}
              delay={index * 70}
              className="bg-[#ffffff] p-9 lg:p-11"
            >
              <p className="font-[family-name:var(--font-newsreader)] text-[5.5rem] leading-none font-light text-[#000000]">
                {tile.value}
              </p>
              <p className="mt-4 text-[12px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
                {tile.unit}
              </p>
              <p className="mt-5 max-w-xs text-[14px] leading-6 text-[#333333]">{tile.body}</p>
            </KineticLine>
          ))}
        </div>
      </div>
    </section>
  );
}
