import { cn } from "@/lib/utils";

type BrandMarkProps = {
  variant?: "white" | "black";
  className?: string;
};

export function BrandMark({ variant = "black", className }: BrandMarkProps) {
  const src =
    variant === "white"
      ? "/brand/hackollab-wordmark-white.svg"
      : "/brand/hackollab-wordmark-black.svg";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Hackollab" className={cn("h-7 w-auto", className)} />
  );
}
