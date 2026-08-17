import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · Hackollab",
  description:
    "How Hackollab collects, uses, and protects personal data for UK university builders.",
};

const UPDATED = "10 August 2026";

export default function PrivacyPolicyPage() {
  return (
    <article className="text-app-body max-w-3xl">
      <header className="border-app-divider border-b pb-8">
        <p className="text-app-label text-eyebrow font-semibold tracking-eyebrow uppercase">
          Legal
        </p>
        <h1 className="text-app-ink mt-3 font-serif text-4xl font-light tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="text-app-meta mt-4 text-sm">
          Last updated: {UPDATED}. This policy applies to Hackollab (including the product
          interface that may appear as “mebi” while we finish rebranding) at{" "}
          <span className="text-app-ink">hackollab.com</span> and related app surfaces.
        </p>
      </header>

      <div className="prose-legal mt-10 space-y-10 text-body-sm leading-7">
        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">1. Who we are</h2>
          <p>
            Hackollab (“Hackollab”, “we”, “us”, “our”) is a UK student collaboration product
            that helps university builders find partners, ship projects, and publish
            peer-verified proof of work.
          </p>
          <p>
            Hackollab is operated by its founders: Maahir Shah (CEO) and Sahil Basumatary
            (CTO). For privacy purposes, the primary contact is Sahil Basumatary. Until a UK
            limited company is incorporated and named in an updated version of this policy, the
            founders of Hackollab are the data controllers for personal data processed through the
            service.
          </p>
          <p>
            Privacy contact:{" "}
            <a
              href="mailto:sahil@sahilbasumatary.dev"
              className="text-app-ink font-medium underline underline-offset-2"
            >
              sahil@sahilbasumatary.dev
            </a>
          </p>
          <p>
            Website:{" "}
            <a
              href="https://hackollab.com"
              className="text-app-ink font-medium underline underline-offset-2"
            >
              https://hackollab.com
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">2. Scope</h2>
          <p>This policy covers personal data we process when you:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>visit our marketing or product websites;</li>
            <li>create an account or sign in;</li>
            <li>complete onboarding or edit your profile;</li>
            <li>use projects, partner discovery, forum, requests, proof, leaderboards, or settings;</li>
            <li>publish or view public profiles and public proof pages;</li>
            <li>contact us about privacy or support.</li>
          </ul>
          <p>
            The service is currently intended for UK university students (in particular King’s
            College London users with eligible institutional email addresses). Access may be
            limited by email allowlists or similar controls.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">
            3. Personal data we collect
          </h2>
          <p>We collect the categories below. Exact fields depend on what you choose to provide.</p>

          <h3 className="text-app-ink pt-2 text-base font-semibold">3.1 Account and identity</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>name and email address;</li>
            <li>authentication identifiers from our auth provider (Clerk), including user ID;</li>
            <li>username and profile photo (if provided);</li>
            <li>sign-in and security settings you manage through Clerk (for example password,
              passkeys, or multi-factor authentication where enabled).</li>
          </ul>

          <h3 className="text-app-ink pt-2 text-base font-semibold">3.2 Profile and connections</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>bio, pronouns, role, skills, interests, and solo/team preferences;</li>
            <li>optional linked profiles or booking links (for example GitHub, LinkedIn, Discord,
              calendar URLs) and whether you choose to show them publicly;</li>
            <li>other social links you add;</li>
            <li>profile visibility settings (including private profile).</li>
          </ul>

          <h3 className="text-app-ink pt-2 text-base font-semibold">3.3 Product activity</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>projects you create or join (name, description, stack, status, progress,
              visibility);</li>
            <li>build-log updates and contribution notes;</li>
            <li>forum threads, posts, tags, votes, and related in-app notifications;</li>
            <li>invites, join requests, messages, and related request status;</li>
            <li>peer signatures / attestations and related statements;</li>
            <li>published proof pages (slug, summary, publish time, and related public content);</li>
            <li>leaderboard-relevant activity derived from published and attested work;</li>
            <li>in-app notifications and notification preferences;</li>
            <li>product preferences (theme, timezone, language, startup page, shortcuts);</li>
            <li>cookie preference choices.</li>
          </ul>

          <h3 className="text-app-ink pt-2 text-base font-semibold">3.4 Technical and usage data</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>IP address, device/browser information, and approximate location derived from
              network data;</li>
            <li>pages visited, timestamps, referrers, and diagnostic logs;</li>
            <li>cookies and similar technologies as described in section 8.</li>
          </ul>

          <h3 className="text-app-ink pt-2 text-base font-semibold">3.5 Data from third parties</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="text-app-ink font-medium">Clerk</span> provides authentication and
              account security. When you sign up or sign in, Clerk processes identity data and
              may send us account events (for example create/update/delete) via secured webhooks.
            </li>
            <li>
              If you later connect social accounts through verified OAuth (for example Discord or
              LinkedIn), we may receive verified account identifiers and basic profile information
              those providers release with your consent.
            </li>
            <li>
              Hosting, database, and file storage providers process technical data as our
              processors (see section 6).
            </li>
          </ul>

          <p>
            We do not require special-category data (such as health, religion, or political
            opinions). Please do not submit that kind of information in profiles, messages, forum
            posts, or proof content.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">
            4. Why we use your data (purposes and lawful bases)
          </h2>
          <p>
            Under UK GDPR we need a lawful basis for each purpose. The main bases we rely on are
            contract, legitimate interests, consent, and legal obligation.
          </p>
          <div className="border-app-divider overflow-x-auto border">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-app-paper text-app-ink">
                <tr>
                  <th className="border-app-divider border-b px-3 py-2 font-semibold">Purpose</th>
                  <th className="border-app-divider border-b px-3 py-2 font-semibold">
                    Lawful basis
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Create and manage your account; authenticate you; keep the service secure",
                    "Contract; legitimate interests (security)",
                  ],
                  [
                    "Provide core product features (projects, partners, forum, requests, proof, leaderboards, settings)",
                    "Contract",
                  ],
                  [
                    "Show public profiles and published proof pages you choose to make public",
                    "Contract; legitimate interests (showing verified student work)",
                  ],
                  [
                    "Send product notifications you enable (inbox, project activity, digests)",
                    "Contract; consent where required for optional email",
                  ],
                  [
                    "Remember preferences and cookie choices",
                    "Legitimate interests; consent for non-essential cookies",
                  ],
                  [
                    "Prevent abuse, debug outages, and maintain service integrity",
                    "Legitimate interests; legal obligation where applicable",
                  ],
                  [
                    "Respond to privacy or support requests",
                    "Legitimate interests; legal obligation",
                  ],
                  [
                    "Optional product updates / marketing emails (if you opt in)",
                    "Consent (you can withdraw anytime)",
                  ],
                ].map(([purpose, basis]) => (
                  <tr key={purpose} className="align-top">
                    <td className="border-app-divider border-b px-3 py-2">{purpose}</td>
                    <td className="border-app-divider border-b px-3 py-2">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Where we rely on legitimate interests, we balance those interests against your rights
            and expectations as a student user of a collaboration and proof product.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">5. Public information</h2>
          <p>
            Some content is designed to be public when you publish or when your profile is not set
            to private. That can include your display name, username, bio, selected skills, badges,
            linked connection links you mark as visible, and published proof pages.
          </p>
          <p>
            Peer attestations on published builds may identify teammates who participated. If a
            member’s profile is private, we redact identifying fields where the product supports
            that, while still reflecting that a person contributed.
          </p>
          <p>
            Public pages may be indexed by search engines or shared by others. Think carefully
            before publishing.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">
            6. Who we share data with
          </h2>
          <p>
            We do not sell your personal data. We share data only as needed to run Hackollab, with
            your direction, or where the law requires.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-app-ink font-medium">Other users</span> — according to product
              visibility (for example teammates on a project, or the public internet for published
              proof).
            </li>
            <li>
              <span className="text-app-ink font-medium">Clerk</span> — authentication and account
              security (
              <a
                href="https://clerk.com/legal/privacy"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Clerk privacy
              </a>
              ).
            </li>
            <li>
              <span className="text-app-ink font-medium">Vercel</span> — application hosting,
              edge/network logs, and optional file storage such as avatars (
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Vercel privacy
              </a>
              ).
            </li>
            <li>
              <span className="text-app-ink font-medium">Neon / PostgreSQL hosting</span> — primary
              application database storage (
              <a
                href="https://neon.tech/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Neon privacy
              </a>
              ).
            </li>
            <li>
              <span className="text-app-ink font-medium">Professional advisers or authorities</span>{" "}
              — if required to comply with law, enforce terms, or protect rights, safety, and
              security.
            </li>
            <li>
              <span className="text-app-ink font-medium">Successors</span> — if Hackollab is involved
              in a reorganisation, incorporation, financing, or transfer of assets, personal data
              may transfer under appropriate safeguards and notice where required.
            </li>
          </ul>
          <p>
            These providers act as processors or independent controllers depending on the service.
            We configure them to support Hackollab’s purposes and UK user expectations as far as
            practicable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">
            7. International transfers
          </h2>
          <p>
            Some providers may process data outside the UK (for example in the EEA or United
            States). Where that happens, we rely on appropriate transfer mechanisms available to
            those providers, such as adequacy regulations or standard contractual clauses, together
            with their security and access controls.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">8. Cookies</h2>
          <p>We use cookies and similar technologies in these groups:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="text-app-ink font-medium">Necessary</span> — sign-in, security, load
              balancing, and core preferences needed to operate the service. These stay on.
            </li>
            <li>
              <span className="text-app-ink font-medium">Preferences</span> — remembering choices
              such as interface preferences where stored client-side.
            </li>
            <li>
              <span className="text-app-ink font-medium">Analytics</span> — understanding product
              usage only if you allow them.
            </li>
            <li>
              <span className="text-app-ink font-medium">Marketing</span> — only if you allow them.
            </li>
          </ul>
          <p>
            You can review or change non-essential cookie choices in product settings (Preferences
            → cookies) or through the cookie banner where shown. Browser controls can also block
            cookies, but necessary cookies may be required for sign-in to work.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">9. Retention</h2>
          <p>We keep personal data only as long as needed for the purposes above:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="text-app-ink font-medium">Account data</span> — for as long as your
              account remains open.
            </li>
            <li>
              <span className="text-app-ink font-medium">Project, proof, and attestation data</span>{" "}
              — while needed to provide the product and maintain the integrity of published proof;
              public proof may remain available until unpublished, deleted, or otherwise removed
              under product rules.
            </li>
            <li>
              <span className="text-app-ink font-medium">Security and server logs</span> — for a
              limited operational period, then deleted or aggregated.
            </li>
            <li>
              <span className="text-app-ink font-medium">Legal holds</span> — longer where we must
              retain data for disputes, security investigations, or legal obligations.
            </li>
          </ul>
          <p>
            When you delete your account, we delete or anonymise personal data we control, except
            where retention is required by law or needed to preserve the integrity of already
            published multi-person proof records (for example replacing your identity with a
            redacted label rather than rewriting history falsely).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">10. Security</h2>
          <p>
            We use technical and organisational measures appropriate to a student collaboration
            product, including encrypted transport (HTTPS), access-controlled cloud infrastructure,
            authenticated APIs, and least-privilege practices for production systems. No method of
            transmission or storage is perfectly secure. If we become aware of a personal data
            breach that must be notified under UK law, we will do so as required.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">11. Your rights</h2>
          <p>Under UK GDPR you may have the right to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>access your personal data;</li>
            <li>correct inaccurate data;</li>
            <li>request deletion;</li>
            <li>restrict or object to certain processing;</li>
            <li>data portability for data you provided to us;</li>
            <li>withdraw consent where processing is consent-based;</li>
            <li>complain to the UK Information Commissioner’s Office (ICO).</li>
          </ul>
          <p>
            To exercise these rights, email{" "}
            <a
              href="mailto:sahil@sahilbasumatary.dev"
              className="text-app-ink font-medium underline underline-offset-2"
            >
              sahil@sahilbasumatary.dev
            </a>
            . We may need to verify your identity first. You can also update many profile and
            preference fields directly in Settings.
          </p>
          <p>
            ICO website:{" "}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              https://ico.org.uk
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">12. Children</h2>
          <p>
            Hackollab is aimed at university students in the UK. It is not directed at children
            under 13, and we do not knowingly collect personal data from children under 13. If you
            believe a child has provided personal data, contact us and we will take appropriate
            steps.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">
            13. Automated decision-making
          </h2>
          <p>
            We use product logic such as match scoring and leaderboard ranking based on activity
            you generate in the service. These features help surface relevant partners or rankings.
            They are not used to make legal or similarly significant decisions about you without
            human involvement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">14. Changes to this policy</h2>
          <p>
            We may update this policy as Hackollab evolves (for example when we incorporate a
            company, add OAuth connections, or expand beyond the UK). We will change the “Last
            updated” date above and, where changes are material, provide additional notice in the
            product or by email where appropriate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-app-ink font-serif text-2xl font-light">15. Contact</h2>
          <p>
            Questions about this policy or your personal data:
            <br />
            Hackollab — Privacy
            <br />
            Email:{" "}
            <a
              href="mailto:sahil@sahilbasumatary.dev"
              className="text-app-ink font-medium underline underline-offset-2"
            >
              sahil@sahilbasumatary.dev
            </a>
            <br />
            Web:{" "}
            <a
              href="https://hackollab.com"
              className="text-app-ink font-medium underline underline-offset-2"
            >
              https://hackollab.com
            </a>
          </p>
          <p className="text-app-meta text-sm">
            This document is provided to describe Hackollab’s current practices. It is not legal
            advice. For formal legal review, consult a UK-qualified solicitor.
          </p>
        </section>
      </div>

      <footer className="border-app-divider mt-12 flex flex-wrap gap-4 border-t pt-6 text-sm">
        <Link href="/" className="text-app-ink underline underline-offset-2">
          Home
        </Link>
        <Link href="/sign-up" className="text-app-ink underline underline-offset-2">
          Sign up
        </Link>
      </footer>
    </article>
  );
}
