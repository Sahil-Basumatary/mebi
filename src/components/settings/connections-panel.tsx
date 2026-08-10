"use client";

import { CalendarDays, Check, Link2, MessageCircle } from "lucide-react";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import {
  calendarDisplay,
  discordDisplay,
  discordHref,
  githubProfileUrl,
} from "@/lib/connections";
import { cn } from "@/lib/utils";
import {
  updateCalendarConnection,
  updateDiscordConnection,
  updateGithubConnection,
  updateLinkedinConnection,
} from "./actions";
import { PrefToggle } from "./pref-ui";

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export type ConnectionsInitial = {
  githubUsername: string;
  showGithub: boolean;
  linkedinUrl: string;
  showLinkedin: boolean;
  discordHandle: string;
  showDiscord: boolean;
  calendarUrl: string;
  showCalendar: boolean;
};

type ConnectionCardProps = {
  title: string;
  hint: string;
  icon: ReactNode;
  connected: boolean;
  valueLabel: string | null;
  href: string | null;
  show: boolean;
  onShowChange: (next: boolean) => void;
  draft: string;
  onDraftChange: (next: string) => void;
  placeholder: string;
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onDisconnect: () => void;
};

function ConnectionCard({
  title,
  hint,
  icon,
  connected,
  valueLabel,
  href,
  show,
  onShowChange,
  draft,
  onDraftChange,
  placeholder,
  error,
  saving,
  onSave,
  onDisconnect,
}: ConnectionCardProps) {
  return (
    <div className="border-app-border rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span className="border-app-border bg-app-surface text-app-fg flex h-9 w-9 shrink-0 items-center justify-center rounded-md border">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-app-fg text-sm font-medium">{title}</p>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[10px] tracking-meta uppercase",
                connected
                  ? "bg-app-surface-2 text-app-fg"
                  : "bg-app-surface text-app-muted",
              )}
            >
              {connected ? "Connected" : "Not connected"}
            </span>
          </div>
          <p className="text-app-muted mt-1 text-[13px] leading-[18px]">{hint}</p>

          {connected ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-app-fg inline-flex items-center gap-1.5 text-sm underline underline-offset-2"
                  >
                    <Check size={14} strokeWidth={2} />
                    {valueLabel}
                  </a>
                ) : (
                  <span className="text-app-fg inline-flex items-center gap-1.5 text-sm">
                    <Check size={14} strokeWidth={2} />
                    {valueLabel}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-app-muted text-[13px]">Show on profile</span>
                  <PrefToggle
                    checked={show}
                    onChange={onShowChange}
                    label={`Show ${title} on profile`}
                  />
                </div>
                <button
                  type="button"
                  onClick={onDisconnect}
                  disabled={saving}
                  className="text-app-muted hover:text-app-fg text-sm transition-colors disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <input
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
                placeholder={placeholder}
                maxLength={200}
                className="border-app-border bg-app-canvas text-app-fg placeholder:text-app-muted-2 focus:border-app-fg h-9 w-full rounded-md border px-3 text-sm outline-none"
              />
              {error ? <p className="text-app-signal text-sm">{error}</p> : null}
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !draft.trim()}
                className="bg-app-fg text-app-canvas hover:opacity-90 inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving…" : "Connect"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConnectionsPanel({
  initial,
  onSaved,
}: {
  initial: ConnectionsInitial;
  onSaved?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [github, setGithub] = useState(initial.githubUsername);
  const [showGithub, setShowGithub] = useState(initial.showGithub);
  const [githubDraft, setGithubDraft] = useState("");
  const [githubError, setGithubError] = useState<string | null>(null);

  const [linkedin, setLinkedin] = useState(initial.linkedinUrl);
  const [showLinkedin, setShowLinkedin] = useState(initial.showLinkedin);
  const [linkedinDraft, setLinkedinDraft] = useState("");
  const [linkedinError, setLinkedinError] = useState<string | null>(null);

  const [discord, setDiscord] = useState(initial.discordHandle);
  const [showDiscord, setShowDiscord] = useState(initial.showDiscord);
  const [discordDraft, setDiscordDraft] = useState("");
  const [discordError, setDiscordError] = useState<string | null>(null);

  const [calendar, setCalendar] = useState(initial.calendarUrl);
  const [showCalendar, setShowCalendar] = useState(initial.showCalendar);
  const [calendarDraft, setCalendarDraft] = useState("");
  const [calendarError, setCalendarError] = useState<string | null>(null);

  useEffect(() => {
    setGithub(initial.githubUsername);
    setShowGithub(initial.showGithub);
    setLinkedin(initial.linkedinUrl);
    setShowLinkedin(initial.showLinkedin);
    setDiscord(initial.discordHandle);
    setShowDiscord(initial.showDiscord);
    setCalendar(initial.calendarUrl);
    setShowCalendar(initial.showCalendar);
  }, [initial]);

  function saveGithub(username: string, show: boolean) {
    setGithubError(null);
    startTransition(async () => {
      const result = await updateGithubConnection({ username, show });
      if (result.error) {
        setGithubError(result.error);
        return;
      }
      setGithub(result.username ?? "");
      setShowGithub(result.show);
      setGithubDraft("");
      onSaved?.();
    });
  }

  function saveLinkedin(url: string, show: boolean) {
    setLinkedinError(null);
    startTransition(async () => {
      const result = await updateLinkedinConnection({ url, show });
      if (result.error) {
        setLinkedinError(result.error);
        return;
      }
      setLinkedin(result.url ?? "");
      setShowLinkedin(result.show);
      setLinkedinDraft("");
      onSaved?.();
    });
  }

  function saveDiscord(handle: string, show: boolean) {
    setDiscordError(null);
    startTransition(async () => {
      const result = await updateDiscordConnection({ handle, show });
      if (result.error) {
        setDiscordError(result.error);
        return;
      }
      setDiscord(result.handle ?? "");
      setShowDiscord(result.show);
      setDiscordDraft("");
      onSaved?.();
    });
  }

  function saveCalendar(url: string, show: boolean) {
    setCalendarError(null);
    startTransition(async () => {
      const result = await updateCalendarConnection({ url, show });
      if (result.error) {
        setCalendarError(result.error);
        return;
      }
      setCalendar(result.url ?? "");
      setShowCalendar(result.show);
      setCalendarDraft("");
      onSaved?.();
    });
  }

  return (
    <div className="space-y-4">
      <ConnectionCard
        title="GitHub"
        hint="Your GitHub handle for teammates and public proof pages."
        icon={<GithubMark className="h-4 w-4" />}
        connected={Boolean(github)}
        valueLabel={github ? `@${github}` : null}
        href={github ? githubProfileUrl(github) : null}
        show={showGithub}
        onShowChange={(next) => saveGithub(github, next)}
        draft={githubDraft}
        onDraftChange={setGithubDraft}
        placeholder="username or github.com/username"
        error={githubError}
        saving={pending}
        onSave={() => saveGithub(githubDraft, showGithub)}
        onDisconnect={() => saveGithub("", showGithub)}
      />

      <ConnectionCard
        title="LinkedIn"
        hint="Link your professional profile so partners can verify who you are."
        icon={<Link2 size={16} strokeWidth={1.75} />}
        connected={Boolean(linkedin)}
        valueLabel={
          linkedin
            ? linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com/i, "linkedin.com")
            : null
        }
        href={linkedin || null}
        show={showLinkedin}
        onShowChange={(next) => saveLinkedin(linkedin, next)}
        draft={linkedinDraft}
        onDraftChange={setLinkedinDraft}
        placeholder="linkedin.com/in/your-name"
        error={linkedinError}
        saving={pending}
        onSave={() => saveLinkedin(linkedinDraft, showLinkedin)}
        onDisconnect={() => saveLinkedin("", showLinkedin)}
      />

      <ConnectionCard
        title="Discord"
        hint="Add a Discord username or invite link for build chat."
        icon={<MessageCircle size={16} strokeWidth={1.75} />}
        connected={Boolean(discord)}
        valueLabel={discord ? discordDisplay(discord) : null}
        href={discord ? discordHref(discord) : null}
        show={showDiscord}
        onShowChange={(next) => saveDiscord(discord, next)}
        draft={discordDraft}
        onDraftChange={setDiscordDraft}
        placeholder="username or discord.gg/invite"
        error={discordError}
        saving={pending}
        onSave={() => saveDiscord(discordDraft, showDiscord)}
        onDisconnect={() => saveDiscord("", showDiscord)}
      />

      <ConnectionCard
        title="Calendar"
        hint="Share a booking link for pairing calls (Cal.com, Calendly, or Google Calendar)."
        icon={<CalendarDays size={16} strokeWidth={1.75} />}
        connected={Boolean(calendar)}
        valueLabel={calendar ? calendarDisplay(calendar) : null}
        href={calendar || null}
        show={showCalendar}
        onShowChange={(next) => saveCalendar(calendar, next)}
        draft={calendarDraft}
        onDraftChange={setCalendarDraft}
        placeholder="cal.com/you or calendly.com/you"
        error={calendarError}
        saving={pending}
        onSave={() => saveCalendar(calendarDraft, showCalendar)}
        onDisconnect={() => saveCalendar("", showCalendar)}
      />
    </div>
  );
}
