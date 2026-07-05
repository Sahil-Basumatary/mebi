import { cn } from "@/lib/utils";
import { LongStemArrow } from "@/components/ui/long-stem-arrow";

type ArrowCircleTone = "onDark" | "onLight";

type ArrowCircleProps = {
  // onDark reads on dark backgrounds (white ring), onLight on light ones (black ring).
  tone?: ArrowCircleTone;
  className?: string;
  arrowClassName?: string;
};

const toneStyles: Record<ArrowCircleTone, string> = {
  onDark: "border-[#ffffff] text-[#ffffff] group-hover:bg-[#ffffff] group-hover:text-[#000000]",
  onLight: "border-[#000000] text-[#000000] group-hover:bg-[#000000] group-hover:text-[#ffffff]",
};

export function ArrowCircle({ tone = "onDark", className, arrowClassName }: ArrowCircleProps) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        toneStyles[tone],
        className,
      )}
    >
      <LongStemArrow className={arrowClassName} />
    </span>
  );
}
