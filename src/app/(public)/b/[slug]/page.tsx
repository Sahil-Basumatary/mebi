import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chip, DataList, DataRow, EmptyState, MetaLine, UserRow } from "@/components/layout";
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
    return { title: "Build not found · Hackollab" };
  }

  const title = `${build.name} · Hackollab`;
  const description =
    build.summary ?? build.description.slice(0, 160) ?? "A published build on Hackollab.";

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
    <article className="flex flex-col gap-4">
      <header className="border-app-divider bg-app-paper border">
        <div className="border-app-divider flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2">
          <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
            Published proof
          </p>
          <Chip tone="ink">{verified ? "verified" : "self-attested"}</Chip>
        </div>
        <div className="px-4 py-4">
          <h1 className="max-w-3xl text-[1.75rem] leading-tight font-medium sm:text-[2rem]">
            {build.name}
          </h1>
          <p className="text-app-body mt-2 max-w-3xl text-sm leading-6">
            {build.summary ?? build.description}
          </p>
          {build.techStack.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {build.techStack.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>
          ) : null}
          <MetaLine className="mt-4">
            <span>
              {build.members.length} builder{build.members.length === 1 ? "" : "s"}
            </span>
            <span aria-hidden>·</span>
            <span>
              {build.updates.length} update{build.updates.length === 1 ? "" : "s"}
            </span>
            <span aria-hidden>·</span>
            <span>
              {build.signatures.length} signature{build.signatures.length === 1 ? "" : "s"}
            </span>
            {build.publishedAt ? (
              <>
                <span aria-hidden>·</span>
                <span>{formatDate(build.publishedAt)}</span>
              </>
            ) : null}
          </MetaLine>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {build.summary && build.summary !== build.description ? (
            <section className="border-app-divider bg-app-paper border px-4 py-4">
              <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
                Project brief
              </p>
              <p className="text-app-body mt-2 max-w-3xl text-sm leading-6">{build.description}</p>
            </section>
          ) : null}

          <section className="border-app-divider bg-app-paper border">
            <div className="border-app-divider flex items-end justify-between gap-4 border-b px-4 py-2.5">
              <div>
                <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
                  Evidence
                </p>
                <h2 className="text-app-ink mt-1 text-sm font-semibold">Build log</h2>
              </div>
              {build.updates.length ? (
                <span className="text-app-meta text-sm tabular-nums">
                  {build.updates.length} entries
                </span>
              ) : null}
            </div>
            {build.updates.length ? (
              <div className="divide-app-divider divide-y">
                {build.updates.map((update) => {
                  const author = publicIdentity(update.author);
                  return (
                    <DataRow key={update.id} className="border-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-app-ink text-sm font-medium">
                          {displayName(author.fullName, author.username)}
                        </p>
                        <span className="text-app-meta text-xs">
                          {formatDate(update.createdAt)}
                        </span>
                      </div>
                      <p className="text-app-body mt-2 max-w-3xl text-sm leading-6">
                        {update.body}
                      </p>
                      {update.progress !== null ? (
                        <MetaLine className="mt-2">
                          <span>Progress updated to {update.progress}%</span>
                        </MetaLine>
                      ) : null}
                    </DataRow>
                  );
                })}
              </div>
            ) : (
              <EmptyState variant="inline" eyebrow="Quiet" title="No published updates." />
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="border-app-divider bg-app-paper border">
            <h2 className="border-app-divider text-app-ink border-b px-4 py-2.5 text-sm font-semibold">
              Builders
            </h2>
            <DataList ariaLabel="Project builders" className="border-0">
              {build.members.map((member) => {
                const identity = publicIdentity(member.user);
                const href = identity.username ? `/u/${identity.username}` : null;
                const row = (
                  <UserRow
                    fullName={identity.fullName}
                    username={identity.username}
                    imageUrl={identity.redacted ? null : member.user.imageUrl}
                    role={identity.redacted ? null : member.user.role}
                    meta={<p className="text-app-meta mt-1 text-xs">{member.role.toLowerCase()}</p>}
                  />
                );
                return (
                  <DataRow key={member.id}>
                    {href ? (
                      <Link href={href} className="block hover:opacity-80">
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </DataRow>
                );
              })}
            </DataList>
          </section>

          {build.signatures.length ? (
            <section className="border-app-divider bg-app-paper border">
              <h2 className="border-app-divider text-app-ink border-b px-4 py-2.5 text-sm font-semibold">
                Attestations
              </h2>
              <DataList ariaLabel="Peer attestations" className="border-0">
                {build.signatures.map((signature) => {
                  const signer = publicIdentity(signature.signer);
                  const subject = publicIdentity(signature.subject);
                  return (
                    <DataRow key={`${signature.signerId}-${signature.subjectId}`}>
                      <p className="text-app-ink text-sm leading-5">
                        <span className="font-medium">
                          {displayName(signer.fullName, signer.username)}
                        </span>{" "}
                        attested{" "}
                        <span className="font-medium">
                          {displayName(subject.fullName, subject.username)}
                        </span>
                      </p>
                      {signature.statement ? (
                        <p className="text-app-body mt-2 text-sm leading-5">
                          “{signature.statement}”
                        </p>
                      ) : null}
                      <p className="text-app-meta mt-2 text-xs">
                        {formatDate(signature.createdAt)}
                      </p>
                    </DataRow>
                  );
                })}
              </DataList>
            </section>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
