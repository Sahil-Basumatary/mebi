import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  label?: string;
  className?: string;
};

export function ProgressBar({ value, label = "Progress", className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={className}>
      <div className="text-app-label mb-2 flex items-center justify-between text-xs">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className="bg-app-divider h-2">
        <div className="bg-app-ink h-full" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
