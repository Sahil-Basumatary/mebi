import { cn } from "@/lib/utils";

type LongStemArrowProps = {
  className?: string;
  strokeWidth?: number;
};

export function LongStemArrow({ className, strokeWidth = 2.25 }: LongStemArrowProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 20"
      className={cn("h-[1.15rem] w-[1.15rem]", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 10h28" />
      <path d="M20 2 30.5 10 20 18" />
    </svg>
  );
}
