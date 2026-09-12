import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_INBOX } from "@/lib/contact-validation";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact · Hackollab",
  description: "Contact Hackollab support with your email, subject, and message.",
};

export default function ContactPage() {
  return (
    <article className="text-app-body max-w-3xl">
      <header className="border-app-divider border-b pb-8">
        <p className="text-app-label text-eyebrow tracking-eyebrow font-semibold uppercase">
          Support
        </p>
        <h1 className="text-app-ink mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
          Contact us
        </h1>
        <p className="text-app-meta mt-4 text-sm leading-6">
          Get support for accounts, product bugs, privacy, and access. Messages go to{" "}
          <a href={`mailto:${SUPPORT_INBOX}`} className="text-app-link font-medium underline underline-offset-2">
            {SUPPORT_INBOX}
          </a>
          , which reaches both founders. Do not send passwords, private keys, or assessment solutions.
        </p>
      </header>
      <div className="mt-8">
        <ContactForm />
      </div>
      <p className="text-app-meta mt-6 text-sm leading-6">
        For legal terms see{" "}
        <Link href="/terms" className="text-app-link underline underline-offset-2">
          Terms of Use
        </Link>
        . For how we handle personal data see{" "}
        <Link href="/privacy" className="text-app-link underline underline-offset-2">
          Privacy
        </Link>
        .
      </p>
    </article>
  );
}
