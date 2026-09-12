import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_INBOX } from "@/lib/contact-validation";

export const metadata: Metadata = {
  title: "Terms of Use · Hackollab",
  description:
    "Terms of Use for Hackollab, including eligibility, acceptable use, AI, GitHub access, and Free/Pro allowances.",
};

const UPDATED = "25 August 2026";

export default function TermsOfUsePage() {
  return (
    <article className="text-app-body max-w-3xl">
      <header className="border-app-divider border-b pb-8">
        <p className="text-app-label text-eyebrow tracking-eyebrow font-semibold uppercase">
          Legal
        </p>
        <h1 className="text-app-ink mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
          Terms of Use
        </h1>
        <p className="text-app-meta mt-4 text-sm">
          Last updated: {UPDATED}. These terms apply to Hackollab at{" "}
          <span className="text-app-ink">hackollab.com</span> and related app surfaces.
        </p>
      </header>

      <div className="prose-legal text-body-sm mt-10 space-y-10 leading-7">
        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">1. Who we are</h2>
          <p>
            Hackollab is a UK student collaboration product operated by Maahir Shah (CEO) and Sahil
            Basumatary (CTO) trading as Hackollab (together, “Hackollab”, “we”, “us”, “our”). Until a
            UK limited company is incorporated and named in an updated version of these terms, those
            two founders are the operators of the service.
          </p>
          <p>
            Support:{" "}
            <a
              href={`mailto:${SUPPORT_INBOX}`}
              className="text-app-link font-medium underline underline-offset-2"
            >
              {SUPPORT_INBOX}
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">2. Agreement</h2>
          <p>
            By creating an account, signing in, or using Hackollab, you agree to these Terms of Use
            and our{" "}
            <Link href="/privacy" className="text-app-link underline underline-offset-2">
              Privacy Policy
            </Link>
            . If you do not agree, do not use the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">3. Eligibility</h2>
          <p>
            You must be at least 18 years old. The service is currently intended for UK university
            students, in particular King’s College London users with an eligible institutional
            email. We may refuse, suspend, or limit access where eligibility cannot be verified.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">4. Accounts</h2>
          <p>
            You are responsible for the accuracy of account information and for keeping sign-in
            credentials confidential. You must not share your account. Notify us promptly if you
            believe your account has been compromised.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">5. Acceptable use</h2>
          <p>You must not:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>break the law, harass others, or post unlawful or harmful content;</li>
            <li>attempt to gain unauthorised access to Hackollab, other users, or third-party systems;</li>
            <li>probe, scrape, or overload the service beyond ordinary use;</li>
            <li>upload malware, secrets you do not own, or content you have no right to share;</li>
            <li>use the service to attack, exploit, or degrade other systems;</li>
            <li>circumvent usage limits, rate limits, or security controls;</li>
            <li>misrepresent identity, university affiliation, or project contribution.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">6. Academic integrity</h2>
          <p>
            Hackollab AI is a learning aid. It may explain concepts, review selected repository
            material, generate hints, and draft documentation. It must not be used to complete
            assessed coursework, exams, or take-home tests dishonestly, or to submit generated work
            as your own where that would breach your university’s academic-integrity rules.
          </p>
          <p>
            We may refuse requests that ask for complete assessed solutions. You remain responsible
            for complying with King’s College London (or other institution) assessment regulations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">7. Your content and repositories</h2>
          <p>
            You retain ownership of content you submit, including project briefs, build logs, forum
            posts, and code in repositories you connect. You grant Hackollab a limited licence to
            host, process, display, and generate derived summaries of that content solely to operate
            the service for you and your teammates.
          </p>
          <p>
            If you connect GitHub, you authorise us to read only the repositories you select, using
            short-lived installation credentials. We do not claim ownership of that code. You can
            revoke GitHub access from GitHub’s application settings and from Hackollab. Revocation
            stops further reads; derived architecture summaries and usage records are then deleted
            or anonymised as described in the Privacy Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">8. AI features</h2>
          <p>
            AI output can be wrong, incomplete, or insecure. It is not professional, academic, or
            legal advice. You must review generated hints, reviews, and documentation before relying
            on them. Private repository content is sent to paid AI providers only after you consent
            in product settings. We do not promise a particular vendor model. Free and Pro users
            receive different capability tiers and monthly allowances.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">9. Free and Pro allowances</h2>
          <p>
            The Free plan includes 50 Standard Hackollab AI requests each UTC month. Pro is intended
            to cost £8.99 per month, with a founding-student offer of £6.99 per month for an early
            cohort, and includes a larger Standard allowance plus a separate Advanced allowance.
            Paid checkout is not live yet. During beta, Pro access may be granted manually and can
            be withdrawn.
          </p>
          <p>
            Allowances are not unlimited. We may throttle, queue, route to a lower-cost model, or
            refuse requests to protect other users and our provider budget. Unused requests do not
            roll over unless we say otherwise in-product.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">10. Fees, cancellation, and refunds</h2>
          <p>
            No card payments are taken under these terms until a billing launch is announced in the
            product. When paid subscriptions begin, charges, VAT (if applicable), cancellation, and
            refunds will be described at checkout and in an updated version of these terms.
            Founding-student pricing, if offered, applies only to the cohort we designate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">11. Availability and changes</h2>
          <p>
            We provide Hackollab on an “as available” basis. Features may change, break, or be
            withdrawn, including AI providers and GitHub integration. We may modify these terms by
            updating this page and the “Last updated” date. Material changes will be notified in
            the product or by email where appropriate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">12. Termination</h2>
          <p>
            You may delete your account in Settings. We may suspend or terminate access for
            breach, abuse, legal risk, or to protect the service. After termination, public
            multi-person proof may be redacted rather than rewritten, as described in the Privacy
            Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">13. Liability</h2>
          <p>
            Nothing in these terms excludes liability that cannot be excluded under English law,
            including for death or personal injury caused by negligence or for fraud. Subject to
            that, Hackollab is provided without warranties of uninterrupted or error-free operation,
            and we are not liable for lost marks, lost offers, or decisions you make based on AI
            output or peer proof.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">14. Governing law</h2>
          <p>
            These terms are governed by the laws of England and Wales. The courts of England and
            Wales have exclusive jurisdiction, except that you may bring a claim in your local
            courts if the law requires.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink text-2xl font-medium">15. Contact</h2>
          <p>
            Questions about these terms:{" "}
            <a
              href={`mailto:${SUPPORT_INBOX}`}
              className="text-app-link font-medium underline underline-offset-2"
            >
              {SUPPORT_INBOX}
            </a>
            .
          </p>
          <p className="text-app-meta text-sm">
            This document describes Hackollab’s intended operating rules. It is not legal advice and
            should be reviewed by a UK-qualified solicitor before being treated as a final contract.
          </p>
        </section>
      </div>
    </article>
  );
}
