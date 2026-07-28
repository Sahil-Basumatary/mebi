import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HairlineGridProps = {
  children: ReactNode;
  className?: string;
  cols?: string;
};

export function HairlineGrid({ children, className, cols }: HairlineGridProps) {
  return (
    <div
      className={cn("border-app-divider bg-app-divider grid gap-px border", className)}
      style={cols ? { gridTemplateColumns: cols } : undefined}
    >
      {children}
    </div>
  );
}

export function HairlineCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("bg-app-paper p-5", className)}>{children}</div>;
}
