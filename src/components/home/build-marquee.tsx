import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type BuildMarqueeProps = {
  text?: string;
  repeat?: number;
  durationSeconds?: number;
  className?: string;
};

function MarqueeGroup({ text, repeat, hidden }: { text: string; repeat: number; hidden?: boolean }) {
  const [firstWord, ...restWords] = text.trim().split(/\s+/);
  const restText = restWords.join(" ");

  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {Array.from({ length: repeat }).map((_, index) => (
        <div key={index} className="flex shrink-0 items-center">
          <span className="whitespace-nowrap font-[family-name:var(--font-newsreader)] text-[clamp(11rem,11vw,18rem)] leading-none font-normal tracking-[-0.02em] text-[#f2f2f2]">
            <span className="font-semibold">{firstWord}</span>
            {restText ? ` ${restText}` : ""}
          </span>
          <span className="mx-10 h-2.5 w-2.5 shrink-0 rounded-full bg-transparent lg:mx-20" />
        </div>
      ))}
    </div>
  );
}

export function BuildMarquee({
  text = "Build Career with Hackollab",
  repeat = 4,
  durationSeconds = 69,
  className,
}: BuildMarqueeProps) {
  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ "--marquee-duration": `${durationSeconds}s` } as CSSProperties}
    >
      <div className="flex w-max animate-marquee-x">
        <MarqueeGroup text={text} repeat={repeat} />
        <MarqueeGroup text={text} repeat={repeat} hidden />
      </div>
    </div>
  );
}
