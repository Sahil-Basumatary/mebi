"use client";

import { useActionState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { CONTACT_MESSAGE_MAX, CONTACT_SUBJECT_MAX } from "@/lib/contact-validation";
import { sendContactMessage, type ContactFormState } from "./actions";

const fieldClass =
  "border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-accent border px-3 py-3 text-sm outline-none";

const initialState: ContactFormState = { ok: false, error: null };

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(sendContactMessage, initialState);

  if (state.ok) {
    return (
      <p
        role="status"
        className="border-app-divider bg-app-paper text-app-body border px-5 py-6 text-sm leading-6"
      >
        Message received. We will reply to the email you entered, usually within a few working days.
      </p>
    );
  }

  return (
    <form action={formAction} className="border-app-divider bg-app-paper flex flex-col gap-4 border p-5">
      <div className="sr-only">
        <label>
          Fax
          <input type="text" name="fax" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className={fieldClass}
          placeholder="you@kcl.ac.uk"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
          Subject
        </span>
        <input
          name="subject"
          required
          minLength={3}
          maxLength={CONTACT_SUBJECT_MAX}
          className={fieldClass}
          placeholder="Account, product, or privacy"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
          Message
        </span>
        <textarea
          name="message"
          required
          minLength={20}
          maxLength={CONTACT_MESSAGE_MAX}
          rows={8}
          className={`${fieldClass} resize-y leading-6`}
          placeholder="What happened, and what you need from us."
        />
      </label>
      {state.error ? (
        <p role="alert" className="border-app-signal/30 bg-app-signal/10 text-app-signal border px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <AppButton type="submit" disabled={isPending}>
          {isPending ? "Sending..." : "Send"}
        </AppButton>
      </div>
    </form>
  );
}
