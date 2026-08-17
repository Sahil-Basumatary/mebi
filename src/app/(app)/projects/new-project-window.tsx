"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Window } from "@/components/ui/window";
import { BriefChecklist, BriefSignalProvider } from "./brief-signal";
import { ProjectForm } from "./project-form";

export function NewProjectWindow({
  label = "New project",
  anchorId,
}: {
  label?: string;
  anchorId?: string;
}) {
  const window = (
    <Window
      title="New project"
      tone="product"
      className="max-h-[90vh] max-w-5xl overflow-y-auto"
      trigger={
        <Button className="bg-app-ink text-app-paper hover:bg-app-accent-hover rounded-none px-5">
          <Plus size={16} strokeWidth={2} aria-hidden />
          {label}
        </Button>
      }
    >
      <BriefSignalProvider>
        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="border-app-divider bg-app-wash border p-5 lg:self-start">
            <BriefChecklist />
          </aside>
          <ProjectForm embedded />
        </div>
      </BriefSignalProvider>
    </Window>
  );
  if (!anchorId) return window;
  return (
    <span id={anchorId} className="inline-flex scroll-mt-24">
      {window}
    </span>
  );
}
