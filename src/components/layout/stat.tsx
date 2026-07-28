import { cn } from "@/lib/utils";

type StatProps = {
  label: string;
  value: string | number;
  className?: string;
};

export function Stat({ label, value, className }: StatProps) {
  return (
    <div className={cn("bg-app-paper p-5", className)}>
      <p className="text-app-label text-meta font-semibold tracking-rail uppercase">{label}</p>
      <p className="text-app-ink mt-3 font-serif text-3xl font-light">{value}</p>
    </div>
  );
}
