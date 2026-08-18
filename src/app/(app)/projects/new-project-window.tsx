"use client";

import { Plus } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
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
        <AppButton type="button">
          <Plus size={16} strokeWidth={2} aria-hidden />
          {label}
        </AppButton>
      }
    >
      <BriefSignalProvider>
        <div className="grid gap-4">
          <div className="border-app-divider bg-app-wash border p-4">
            <BriefChecklist />
          </div>
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
