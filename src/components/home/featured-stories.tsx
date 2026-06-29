import { KineticLine } from "@/components/home/kinetic-line";
import { FEATURED_STORIES } from "@/lib/stories";

export function FeaturedStories() {
  return (
    <section id="proof-layer" className="bg-[#000000] text-[#ffffff]">
      <div className="mx-auto w-full max-w-[88rem] px-6 py-28 lg:px-12 lg:py-40">
        <div className="flex items-end justify-between pb-10">
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
            News & Insights
          </KineticLine>
        </div>
        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {FEATURED_STORIES.map((story, index) => (
            <KineticLine key={story.title} delay={index * 70} className="group flex flex-col">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0d0d0d]">
                {story.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={story.image}
                    alt={story.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-[10px] font-semibold tracking-[0.32em] text-[#3a3a3a] uppercase">
                      Image coming soon
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between gap-8 pt-6">
                <KineticLine
                  as="h3"
                  delay={index * 70 + 40}
                  variant="headline"
                  className="font-[family-name:var(--font-newsreader)] text-[1.6rem] leading-[1.18] font-light text-[#ffffff]"
                >
                  {story.title}
                </KineticLine>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] text-[#8f8f8f] uppercase">
                    <span>{story.category}</span>
                    <span className="h-1 w-1 rounded-full bg-[#333333]" />
                    <span>{story.date}</span>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ffffff] text-xl leading-none text-[#ffffff] transition-colors group-hover:bg-[#ffffff] group-hover:text-[#000000]">
                    &rarr;
                  </span>
                </div>
              </div>
            </KineticLine>
          ))}
        </div>
      </div>
    </section>
  );
}
