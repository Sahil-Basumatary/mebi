"use client";

import { useEffect, useState, useTransition } from "react";
import { PrefRow, PrefSection, PrefToggle } from "./pref-ui";
import { updateNotificationPreferences } from "./actions";

export type NotificationPrefs = {
  notifyInbox: boolean;
  notifyProjectActivity: boolean;
  notifyWeeklyDigest: boolean;
  notifyMarketing: boolean;
};

export function NotificationsPanel({ initial }: { initial: NotificationPrefs }) {
  const [, startTransition] = useTransition();
  const [prefs, setPrefs] = useState(initial);

  useEffect(() => {
    setPrefs(initial);
  }, [initial]);

  function setPref<K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    startTransition(async () => {
      const result = await updateNotificationPreferences(next);
      if (result.error) setPrefs(previous);
    });
  }

  return (
    <div className="space-y-10">
      <PrefSection title="In mebi">
        <PrefRow
          label="Inbox requests"
          hint="Notify me when someone invites me or asks to join a build."
        >
          <PrefToggle
            checked={prefs.notifyInbox}
            onChange={(next) => setPref("notifyInbox", next)}
            label="Inbox requests"
          />
        </PrefRow>
        <PrefRow
          label="Project activity"
          hint="Updates when teammates post build-log entries or signatures on my projects."
        >
          <PrefToggle
            checked={prefs.notifyProjectActivity}
            onChange={(next) => setPref("notifyProjectActivity", next)}
            label="Project activity"
          />
        </PrefRow>
      </PrefSection>

      <PrefSection title="Email">
        <PrefRow
          label="Weekly digest"
          hint="A short weekly summary of open builds, requests, and leaderboard movement."
        >
          <PrefToggle
            checked={prefs.notifyWeeklyDigest}
            onChange={(next) => setPref("notifyWeeklyDigest", next)}
            label="Weekly digest"
          />
        </PrefRow>
        <PrefRow
          label="Product updates"
          hint="Occasional notes about new mebi features. Never sold to third parties."
        >
          <PrefToggle
            checked={prefs.notifyMarketing}
            onChange={(next) => setPref("notifyMarketing", next)}
            label="Product updates"
          />
        </PrefRow>
      </PrefSection>
    </div>
  );
}
