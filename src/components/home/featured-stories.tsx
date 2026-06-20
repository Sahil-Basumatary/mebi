import { KineticLine } from "@/components/home/kinetic-line";

const stories = [
  {
    category: "Product",
    date: "Coming soon",
    title: "How a three-person KCL team could ship a fintech prototype in a single term.",
  },
  {
    category: "Builders",
    date: "Coming soon",
    title: "From a half-formed idea to a structured request that the right specialist answers.",
  },
  {
    category: "Outcomes",
    date: "Coming soon",
    title: "Turning a finished project into the story you actually tell in a spring week interview.",
  },
];

export function FeaturedStories() {
  return (
    <section id="proof-layer" className="bg-[#000000] text-[#ffffff]">
      <div className="mx-auto w-full max-w-[88rem] px-6 py-28 lg:px-12 lg:py-40">
        <div className="flex items-end justify-between border-b border-[#262626] pb-10">
          <KineticLine
            variant="headline"
            className="font-[family-name:var(--font-newsreader)] text-[clamp(1.7rem,2.6vw,2.4rem)] font-light tracking-[-0.015em] text-[#ffffff]"
          >
            Featured stories
          </KineticLine>
          <KineticLine
            delay={40}
            className="text-[12px] font-semibold tracking-[0.22em] text-[#8f8f8f] uppercase"
          >
            Pattern recognition
          </KineticLine>
        </div>
        <div className="grid gap-px overflow-hidden border-x border-b border-[#262626] bg-[#262626] md:grid-cols-3">
          {stories.map((story, index) => (
            <KineticLine
              key={story.title}
              delay={index * 70}
              className="group flex min-h-[24rem] flex-col justify-between bg-[#000000] p-8 transition-colors hover:bg-[#050505] lg:p-10"
            >
              <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] text-[#8f8f8f] uppercase">
                <span>{story.category}</span>
                <span className="h-1 w-1 rounded-full bg-[#333333]" />
                <span>{story.date}</span>
              </div>
              <KineticLine
                as="h3"
                delay={index * 70 + 40}
                variant="headline"
                className="font-[family-name:var(--font-newsreader)] text-[1.8rem] leading-[1.18] font-light text-[#ffffff]"
              >
                {story.title}
              </KineticLine>
              <span className="inline-flex items-center gap-4 text-[13px] font-medium text-[#ffffff]">
                <span>Read story</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ffffff] text-xl leading-none transition-colors group-hover:bg-[#ffffff] group-hover:text-[#000000]">
                  &rarr;
                </span>
              </span>
            </KineticLine>
          ))}
        </div>
      </div>
    </section>
  );
}
