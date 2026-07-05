"use client";

import { useReverification, useUser } from "@clerk/nextjs";
import { ChevronRight, Info, Loader2 } from "lucide-react";
import { useReducer, useState } from "react";
import { useReverificationHandler } from "./reverification";

// Clerk's email resource type, inferred from the user resource so we stay typed
// without importing @clerk/types directly.
type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;
type EmailResource = ClerkUser["emailAddresses"][number];

const primaryButton =
  "flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-[#2783de] px-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50";
const outlineButton =
  "border-app-border text-app-fg hover:bg-app-hover flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-sm font-medium transition-colors disabled:opacity-50";
const textButton =
  "text-app-muted hover:text-app-fg text-[13px] transition-colors disabled:opacity-50";

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "errors" in error) {
    const list = (error as { errors?: { message?: string }[] }).errors;
    if (list?.[0]?.message) return list[0].message;
  }
  return "Something went wrong. Please try again.";
}

export function EmailRow({ onManage }: { onManage: () => void }) {
  const { user, isLoaded } = useUser();
  const primary =
    isLoaded && user
      ? (user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ??
        "")
      : "";

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="text-app-fg text-sm font-medium">Email</p>
        <p className="text-app-muted text-[13px] leading-[18px]">{primary || "No email on file"}</p>
      </div>
      <button type="button" onClick={onManage} className={outlineButton}>
        Manage emails
      </button>
    </div>
  );
}

export function EmailsPane({
  sectionLabel,
  onBack,
}: {
  sectionLabel: string;
  onBack: () => void;
}) {
  const { user, isLoaded } = useUser();
  const [, refresh] = useReducer((count: number) => count + 1, 0);

  // Adding a new email is a two-step flow: enter the address, then confirm the
  // code Clerk sends to it. Sensitive mutations are wrapped in reverification.
  const [mode, setMode] = useState<"idle" | "adding" | "verifying">("idle");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<EmailResource | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onNeedsReverification } = useReverificationHandler();
  const createEmail = useReverification((email: string) => user!.createEmailAddress({ email }), {
    onNeedsReverification,
  });
  const setPrimary = useReverification(
    (id: string) => user!.update({ primaryEmailAddressId: id }),
    { onNeedsReverification },
  );
  const removeEmail = useReverification((resource: EmailResource) => resource.destroy(), {
    onNeedsReverification,
  });

  function resetAdd() {
    setMode("idle");
    setNewEmail("");
    setCode("");
    setPending(null);
    setError(null);
    setBusy(false);
  }

  async function startAdd() {
    if (!newEmail.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createEmail(newEmail.trim());
      await created.prepareVerification({ strategy: "email_code" });
      setPending(created);
      setMode("verifying");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode() {
    if (!pending || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await pending.attemptVerification({ code: code.trim() });
      await user!.reload();
      resetAdd();
      refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  async function makePrimary(id: string) {
    setError(null);
    try {
      await setPrimary(id);
      await user!.reload();
      refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function remove(resource: EmailResource) {
    setError(null);
    try {
      await removeEmail(resource);
      await user!.reload();
      refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  const emails = isLoaded && user ? user.emailAddresses : [];
  const primaryId = user?.primaryEmailAddressId;

  return (
    <div>
      <nav className="text-app-muted flex items-center gap-1 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-app-fg transition-colors"
        >
          {sectionLabel}
        </button>
        <ChevronRight size={14} strokeWidth={1.75} className="text-app-muted-2" />
        <span className="text-app-fg">Manage emails</span>
      </nav>

      <div className="mt-4">
        <h2 className="text-app-fg text-[26px] leading-8 font-semibold tracking-[-0.01em]">
          Manage emails
        </h2>
        <p className="text-app-muted mt-1.5 text-base">
          Log into mebi with multiple email addresses, managed under one account
        </p>
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-lg bg-[#2783de]/10 p-4">
        <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[#387dc9]" />
        <p className="text-sm font-medium text-[#387dc9]">
          Customer support and other in-product emails will be sent only to your primary email
          address
        </p>
      </div>

      <div className="mt-6">
        {mode === "idle" ? (
          <button type="button" onClick={() => setMode("adding")} className={primaryButton}>
            Add email address
          </button>
        ) : null}

        {mode === "adding" ? (
          <div className="space-y-2">
            <input
              type="email"
              autoComplete="off"
              autoFocus
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="you@example.com"
              className="border-app-border bg-app-surface text-app-fg placeholder:text-app-muted-2 focus:border-app-border-strong h-9 w-full rounded-md border px-2.5 text-sm outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startAdd}
                disabled={busy || !newEmail.trim()}
                className={primaryButton}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                Add
              </button>
              <button type="button" onClick={resetAdd} disabled={busy} className={textButton}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {mode === "verifying" ? (
          <div className="space-y-2">
            <p className="text-app-muted text-[13px]">
              Enter the code sent to <span className="text-app-fg">{pending?.emailAddress}</span>.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Verification code"
              className="border-app-border bg-app-surface text-app-fg placeholder:text-app-muted-2 focus:border-app-border-strong h-9 w-full rounded-md border px-2.5 text-sm outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={confirmCode}
                disabled={busy || !code.trim()}
                className={primaryButton}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                Verify
              </button>
              <button type="button" onClick={resetAdd} disabled={busy} className={textButton}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-2 text-[13px] text-[#e56458]">{error}</p> : null}
      </div>

      <ul className="border-app-border mt-6 border-t">
        {emails.map((item) => {
          const isPrimary = item.id === primaryId;
          const verified = item.verification?.status === "verified";
          return (
            <li
              key={item.id}
              className="border-app-border flex items-center justify-between gap-4 border-b py-3"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <span className="text-app-fg truncate">{item.emailAddress}</span>
                {isPrimary ? <span className="text-app-muted">(primary)</span> : null}
                {!verified ? <span className="text-[#e56458]">Unverified</span> : null}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                {verified && !isPrimary ? (
                  <button
                    type="button"
                    onClick={() => makePrimary(item.id)}
                    className={textButton}
                  >
                    Set as primary
                  </button>
                ) : null}
                {!isPrimary ? (
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="text-[13px] text-[#e56458] transition-opacity hover:opacity-80"
                  >
                    Remove
                  </button>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
