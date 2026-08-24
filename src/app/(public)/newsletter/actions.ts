"use server";

import { redirect } from "next/navigation";
import {
  joinNewsletterWaitlist,
  unsubscribeNewsletter,
  type NewsletterJoinResult,
} from "@/lib/newsletter";

export type JoinNewsletterState = NewsletterJoinResult;

export async function joinNewsletter(
  _previous: JoinNewsletterState,
  formData: FormData,
): Promise<JoinNewsletterState> {
  return joinNewsletterWaitlist(formData);
}

export async function confirmNewsletterUnsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  await unsubscribeNewsletter(token);
  redirect(`/newsletter/unsubscribe?token=${encodeURIComponent(token)}`);
}
