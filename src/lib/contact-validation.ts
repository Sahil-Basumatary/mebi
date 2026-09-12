export const CONTACT_SUBJECT_MAX = 120;
export const CONTACT_MESSAGE_MAX = 4000;

const SUBJECT_PATTERN = /^[\p{L}\p{N} .,'!?\-()/:#&+]{3,120}$/u;

export type ContactFields = {
  email: string;
  subject: string;
  message: string;
};

export type ContactParseResult =
  | { ok: true; value: ContactFields }
  | { ok: false; error: string };

export function parseContactFields(input: {
  email: unknown;
  subject: unknown;
  message: unknown;
  honeypot?: unknown;
}): ContactParseResult {
  if (typeof input.honeypot === "string" && input.honeypot.trim()) {
    return { ok: false, error: "ignored" };
  }

  if (typeof input.email !== "string") {
    return { ok: false, error: "Add a reply email." };
  }
  const email = input.email.trim().toLowerCase();
  if (email.length < 5 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Add a valid reply email." };
  }

  if (typeof input.subject !== "string") {
    return { ok: false, error: "Add a subject." };
  }
  const subject = input.subject.trim().replace(/\s+/g, " ");
  if (subject.length < 3 || subject.length > CONTACT_SUBJECT_MAX) {
    return { ok: false, error: "Subject must be 3–120 characters." };
  }
  if (!SUBJECT_PATTERN.test(subject)) {
    return { ok: false, error: "Subject uses unsupported characters." };
  }

  if (typeof input.message !== "string") {
    return { ok: false, error: "Add a message." };
  }
  const message = input.message.trim();
  if (message.length < 20) {
    return { ok: false, error: "Tell us a bit more so we can help." };
  }
  if (message.length > CONTACT_MESSAGE_MAX) {
    return { ok: false, error: "Keep the message under 4,000 characters." };
  }

  return { ok: true, value: { email, subject, message } };
}

export const SUPPORT_INBOX = "support@hackollab.com";
export const CONTACT_RETENTION_DAYS = 90;
