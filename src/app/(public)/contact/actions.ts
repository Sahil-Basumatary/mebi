"use server";

import { submitContactForm, type ContactSubmitResult } from "@/lib/contact";

export type ContactFormState = ContactSubmitResult;

export async function sendContactMessage(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  return submitContactForm(formData);
}
