import { Newsreader } from "next/font/google";
import { cn } from "@/lib/utils";

const markSerif = Newsreader({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

type BrandMarkProps = {
  variant?: "white" | "black";
  className?: string;
};

export function BrandMark({ variant = "black", className }: BrandMarkProps) {
  const onDark = variant === "white";
  const ink = onDark ? "#ffffff" : "#000000";
  const paper = onDark ? "#000000" : "#ffffff";

  return (
    <svg
      viewBox="0 0 136 54"
      role="img"
      aria-label="Hackollab"
      className={cn(markSerif.className, "h-7 w-auto", className)}
    >
      <rect width="136" height="54" fill={ink} />
      <rect x="1" y="1" width="134" height="52" fill={paper} />
      <text
        x="68"
        y="27"
        fill={ink}
        fontSize="29"
        fontWeight="400"
        letterSpacing="-0.02em"
        textAnchor="middle"
        dominantBaseline="central"
      >
        Hackollab
      </text>
    </svg>
  );
}
