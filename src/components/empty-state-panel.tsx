import { Panel } from "@/components/ui/panel";

type EmptyStatePanelProps = {
  title: string;
  description: string;
  points: string[];
};

export function EmptyStatePanel({ title, description, points }: EmptyStatePanelProps) {
  return (
    <Panel title={title}>
      <p className="text-muted max-w-2xl text-sm leading-relaxed">{description}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {points.map((point) => (
          <div key={point} className="rounded-md border border-border bg-raised p-4 text-sm">
            {point}
          </div>
        ))}
      </div>
    </Panel>
  );
}
