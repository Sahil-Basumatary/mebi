import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chip, UserRow } from "@/components/layout";
import { isProjectVerified } from "@/lib/proof";
import { getPublishedBuildBySlug, publicIdentity } from "@/lib/public-profile";
import { displayName } from "@/lib/user-display";

type BuildPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export async function generateMetadata({ params }: BuildPageProps): Promise<Metadata> {
  const { slug } = await params;
  const build = await getPublishedBuildBySlug(slug);
  if (!build) {
    return { title: "Build not found · mebi" };
  }

  const title = `${build.name} · mebi`;
  const description =
    build.summary ?? build.description.slice(0, 160) ?? "A published build on mebi.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: build.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicBuildPage({ params }: BuildPageProps) {
  const { slug } = await params;
  const build = await getPublishedBuildBySlug(slug);
  if (!build) notFound();

  const memberIds = build.members.map((member) => member.user.id);
  const verified = isProjectVerified(memberIds, build.signatures);

  return (
    <article className="flex flex-col gap-10">
      <header className="border-app-divider bg-app-paper border px-6 py-8 sm:px-10 sm:py-12">
        <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
          Published proof
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {build.name}
        </h1>
        <p className="text-app-body mt-5 max-w-2xl text-body leading-7">
          {build.summary ?? build.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Chip tone="ink">{verified ? "verified" : "self-attested"}</Chip>
          {build.publishedAt ? <Chip>shipped {formatDate(build.publishedAt)}</Chip> : null}
          {build.techStack.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      </header>

      <section>
        <h2 className="font-serif text-3xl font-light">Builders</h2>
        <ul className="border-app-divider mt-5 divide-y border">
          {build.members.map((member) => {
            const identity = publicIdentity(member.user);
            const href = identity.username ? `/u/${identity.username}` : null;
            const row = (
              <UserRow
                fullName={identity.fullName}
                username={identity.username}
                imageUrl={identity.redacted ? null : member.user.imageUrl}
                role={identity.redacted ? null : member.user.role}
                meta={
                  <p className="text-app-meta mt-1 font-mono text-chip tracking-meta uppercase">
                    {member.role.toLowerCase()}
                  </p>
                }
              />
            );
            return (
              <li key={member.id} className="bg-app-paper px-5 py-4">
                {href ? (
                  <Link href={href} className="block hover:opacity-80">
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {build.signatures.length ? (
        <section>
          <h2 className="font-serif text-3xl font-light">Signatures</h2>
          <ul className="border-app-divider mt-5 divide-y border">
            {build.signatures.map((signature) => {
              const signer = publicIdentity(signature.signer);
              const subject = publicIdentity(signature.subject);
              return (
                <li
                  key={`${signature.signerId}-${signature.subjectId}`}
                  className="bg-app-paper px-5 py-4"
                >
                  <p className="text-app-ink text-sm leading-6">
                    <span className="font-medium">
                      {displayName(signer.fullName, signer.username)}
                    </span>{" "}
                    attested{" "}
                    <span className="font-medium">
                      {displayName(subject.fullName, subject.username)}
                    </span>
                  </p>
                  {signature.statement ? (
                    <p className="text-app-body mt-2 max-w-2xl text-body-sm leading-6">
                      “{signature.statement}”
                    </p>
                  ) : null}
                  <p className="text-app-meta mt-1 font-mono text-chip tracking-meta uppercase">
                    {formatDate(signature.createdAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {build.updates.length ? (
        <section>
          <h2 className="font-serif text-3xl font-light">Build log</h2>
          <ul className="border-app-divider mt-5 divide-y border">
            {build.updates.map((update) => {
              const author = publicIdentity(update.author);
              return (
                <li key={update.id} className="bg-app-paper px-5 py-5">
                  <p className="text-app-label text-sm font-medium">
                    {displayName(author.fullName, author.username)}
                  </p>
                  <p className="text-app-meta mt-1 font-mono text-chip tracking-meta uppercase">
                    {formatDate(update.createdAt)}
                  </p>
                  <p className="text-app-body mt-3 max-w-3xl text-body leading-6">{update.body}</p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
