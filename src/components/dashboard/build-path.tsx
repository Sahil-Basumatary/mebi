import { Chip } from "@/components/layout";
import { cn } from "@/lib/utils";

export type BuildStageState = "done" | "current" | "todo";

export type BuildStage = {
  id: string;
  label: string;
  hint: string;
  state: BuildStageState;
};

const FILL_WIDTH: Record<BuildStageState, string> = {
  done: "w-full",
  current: "w-1/2",
  todo: "w-0",
};

export function BuildPath({ stages }: { stages: BuildStage[] }) {
  return (
    <section
      aria-label="Build path"
      className="border-app-divider bg-app-divider grid gap-px border sm:grid-cols-2 2xl:grid-cols-4"
    >
      {stages.map((stage, index) => (
        <div key={stage.id} className="bg-app-paper flex flex-col p-3">
          <span aria-hidden className="bg-app-divider block h-1 w-full">
            <span className={cn("bg-app-ink block h-1", FILL_WIDTH[stage.state])} />
          </span>
          <div className="mt-3 flex h-6 items-center justify-between gap-2">
            <span className="text-app-meta text-chip tracking-meta font-mono">
              {String(index + 1).padStart(2, "0")}
            </span>
            {stage.state === "current" ? <Chip tone="ink">You are here</Chip> : null}
          </div>
          <p
            className={cn(
              "text-meta tracking-rail mt-2 font-semibold uppercase",
              stage.state === "todo" ? "text-app-label" : "text-app-ink",
            )}
          >
            {stage.label}
          </p>
          <p className="text-app-meta mt-1 text-xs">{stage.hint}</p>
        </div>
      ))}
    </section>
  );
}
