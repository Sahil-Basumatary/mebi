"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { PrefRow, PrefSection, PrefToggle } from "./pref-ui";
import { updateShowGithub } from "./actions";

export function ConnectionsPanel({
  githubUsername,
  showGithub,
  onSaved,
}: {
  githubUsername: string;
  showGithub: boolean;
  onSaved?: () => void;
}) {
  const [, startTransition] = useTransition();
  const [visible, setVisible] = useState(showGithub);

  useEffect(() => {
    setVisible(showGithub);
  }, [showGithub]);

  function chooseVisibility(next: boolean) {
    const previous = visible;
    setVisible(next);
    startTransition(async () => {
      const result = await updateShowGithub(next);
      if (result.error) {
        setVisible(previous);
        return;
      }
      onSaved?.();
    });
  }

  return (
    <div className="space-y-10">
      <PrefSection title="GitHub">
        <PrefRow
          label="Show GitHub on profile"
          hint={
            githubUsername
              ? `Linked as @${githubUsername}. Control whether it appears on your public profile.`
              : "Add a GitHub username in Profile first, then choose whether it shows publicly."
          }
        >
          <PrefToggle
            checked={visible}
            onChange={chooseVisibility}
            label="Show GitHub on profile"
          />
        </PrefRow>
        {!githubUsername ? (
          <p className="text-app-muted text-sm">
            No GitHub username saved yet.{" "}
            <span className="text-app-fg">Open Profile</span> to add one.
          </p>
        ) : (
          <p className="text-app-muted text-sm">
            Manage social links and your handle in Profile. Public page:{" "}
            <Link
              href={`https://github.com/${githubUsername}`}
              target="_blank"
              rel="noreferrer"
              className="text-app-fg underline underline-offset-2"
            >
              github.com/{githubUsername}
            </Link>
          </p>
        )}
      </PrefSection>

      <PrefSection title="Coming soon">
        <p className="text-app-muted text-sm leading-6">
          Calendar, Discord, and LinkedIn connections will land here once proof export and invite
          flows need them.
        </p>
      </PrefSection>
    </div>
  );
}
