"use client";

import { useState, useTransition } from "react";
import type { SettingsData } from "./actions";
import { exportAiWorkspace, updateAiConsent, updateAiDisabled } from "./actions";
import { PrefRow, PrefSection, PrefToggle } from "./pref-ui";

export function PlanPanel({
  initial,
  onSaved,
}: {
  initial: SettingsData["plan"];
  onSaved?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [consent, setConsent] = useState(initial.aiConsent);
  const [disabled, setDisabled] = useState(initial.aiDisabled);
  const [exportError, setExportError] = useState<string | null>(null);

  const resetLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(initial.resetAt));

  function downloadExport() {
    setExportError(null);
    startTransition(async () => {
      const result = await exportAiWorkspace();
      if (result.error || !result.payload) {
        setExportError(result.error ?? "Export failed.");
        return;
      }
      const blob = new Blob([result.payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "hackollab-ai-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-8">
      <PrefSection title="Plan">
        <PrefRow
          label={initial.tier === "PRO" ? "Pro" : "Free"}
          hint={
            initial.tier === "PRO"
              ? "Advanced Hackollab AI is on for this account."
              : `${initial.usage.standard.allowance} Standard requests each UTC month.`
          }
        >
          <span className="text-app-muted text-sm tabular-nums">{initial.tier}</span>
        </PrefRow>
        <PrefRow
          label="Standard requests this month"
          hint={`Resets ${resetLabel}. Unused requests do not roll over.`}
        >
          <span className="text-app-fg text-sm tabular-nums">
            {initial.usage.standard.remaining} / {initial.usage.standard.allowance} left
          </span>
        </PrefRow>
        {initial.usage.standard.reserved > 0 ? (
          <p className="text-app-muted text-[13px]">
            {initial.usage.standard.reserved} Standard requests reserved on in-flight work.
          </p>
        ) : null}
        {initial.tier === "PRO" ? (
          <PrefRow
            label="Advanced requests this month"
            hint="Used for architecture maps, commit reviews, and documentation drafts."
          >
            <span className="text-app-fg text-sm tabular-nums">
              {initial.usage.advanced.remaining} / {initial.usage.advanced.allowance} left
            </span>
          </PrefRow>
        ) : null}
      </PrefSection>

      <PrefSection title="Advanced Hackollab AI">
        <p className="text-app-muted text-[13px] leading-[18px]">
          Pro unlocks Advanced Hackollab AI for harder reviews and documentation, with a separate
          monthly cap from Standard requests. We do not promise a particular vendor model. Standard
          price is £{initial.prices.standard}/month. Founding-student pricing is £
          {initial.prices.founding}/month for the designated cohort. Checkout is not live yet; Pro
          is granted only during beta.
        </p>
      </PrefSection>

      <PrefSection title="Privacy">
        <PrefRow
          label="Send private repository content to AI providers"
          hint="Required before private code leaves Hackollab. Public repositories can still be indexed without this."
        >
          <PrefToggle
            checked={consent}
            label="AI consent for private repositories"
            onChange={(next) => {
              setConsent(next);
              startTransition(async () => {
                const result = await updateAiConsent(next);
                if (result.error) setConsent(!next);
                else onSaved?.();
              });
            }}
          />
        </PrefRow>
        <PrefRow
          label="Disable Hackollab AI on this account"
          hint="Stops new AI requests. Your index and drafts stay until you delete them or the account."
        >
          <PrefToggle
            checked={disabled}
            label="Disable AI"
            onChange={(next) => {
              setDisabled(next);
              startTransition(async () => {
                const result = await updateAiDisabled(next);
                if (result.error) setDisabled(!next);
                else onSaved?.();
              });
            }}
          />
        </PrefRow>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-app-fg text-sm font-medium">Export AI workspace</p>
            <p className="text-app-muted text-[13px] leading-[18px]">
              Download usage, hints, reviews, and drafts from this account.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadExport}
            disabled={pending}
            className="border-app-border text-app-fg hover:bg-app-hover h-8 rounded-md border px-3 text-sm font-medium disabled:opacity-50"
          >
            {pending ? "Preparing…" : "Download JSON"}
          </button>
        </div>
        {exportError ? <p className="text-app-signal text-sm">{exportError}</p> : null}
      </PrefSection>
    </div>
  );
}
