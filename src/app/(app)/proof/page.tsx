import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  AppTabs,
  Chip,
  DataList,
  DataRow,
  EmptyState,
  ListColumns,
  MetaLine,
  PageHeader,
} from "@/components/layout";
import { AppButton } from "@/components/ui/app-button";
import { requireOnboardedUser } from "@/lib/current-user";
import { isProjectVerified } from "@/lib/proof";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ProofPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const view = first(params.view) === "finished" ? "finished" : "published";
  const [published, drafts] = await Promise.all([
    prisma.project.findMany({
      where: {
        ...memberProjectWhere(user.id),
        publishedAt: { not: null },
        status: "COMPLETED",
      },
      orderBy: { publishedAt: "desc" },
      include: {
        members: {
          select: {
            userId: true,
            user: { select: { fullName: true, username: true } },
          },
        },
        signatures: {
          where: { revokedAt: null },
          select: { signerId: true, subjectId: true, revokedAt: true },
        },
        _count: { select: { updates: true } },
      },
    }),
    prisma.project.findMany({
      where: {
        ...memberProjectWhere(user.id),
        status: "COMPLETED",
        publishedAt: null,
      },
      orderBy: { completedAt: "desc" },
      select: {
        id: true,
        name: true,
        completedAt: true,
        members: { select: { userId: true } },
        signatures: {
          where: { revokedAt: null },
          select: { signerId: true, subjectId: true, revokedAt: true },
        },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        density="compact"
        eyebrow="Portfolio"
        title="Proof"
        description="Published work and teammate attestations."
        actions={
          <>
            <AppButton asChild variant="secondary">
              <Link href="/leaderboard">Leaderboard</Link>
            </AppButton>
            {user.username ? (
              <AppButton asChild>
                <Link href={`/u/${user.username}`}>Public profile</Link>
              </AppButton>
            ) : null}
          </>
        }
      />
      <DataList
        ariaLabel={view === "published" ? "Published proof pages" : "Unpublished finished projects"}
        toolbar={
          <AppTabs
            attached
            ariaLabel="Proof lists"
            active={view}
            items={[
              {
                id: "published",
                label: "Published",
                count: published.length,
                href: "/proof",
              },
              {
                id: "finished",
                label: "Finished",
                count: drafts.length,
                href: "/proof?view=finished",
              },
            ]}
          />
        }
        columns={
          view === "published" && published.length ? (
            <ListColumns className="grid-cols-[minmax(0,1fr)_10rem_1.5rem]">
              <span>Proof</span>
              <span className="text-right">Published</span>
              <span aria-hidden />
            </ListColumns>
          ) : null
        }
        empty={
          view === "published" ? (
            <EmptyState
              variant="inline"
              eyebrow="Nothing published"
              title="No proof pages yet."
              action={
                <AppButton asChild>
                  <Link href="/projects">Open projects</Link>
                </AppButton>
              }
            />
          ) : (
            <EmptyState
              variant="inline"
              eyebrow="Private"
              title="No unpublished finished builds."
              action={
                <AppButton asChild variant="secondary">
                  <Link href="/projects">Open projects</Link>
                </AppButton>
              }
            />
          )
        }
      >
        {view === "published" && published.length
          ? published.map((project) => {
              const memberIds = project.members.map((member) => member.userId);
              const verified = isProjectVerified(memberIds, project.signatures);
              const href = project.slug ? `/b/${project.slug}` : `/projects/${project.id}`;
              return (
                <DataRow
                  key={project.id}
                  className="grid gap-4 md:grid-cols-[minmax(0,1fr)_10rem_1.5rem] md:items-center"
                >
                  <Link href={href} className="group min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-app-ink text-base font-semibold group-hover:underline">
                        {project.name}
                      </h3>
                      <Chip tone="ink">{verified ? "verified" : "self-attested"}</Chip>
                    </div>
                    <p className="text-app-body mt-1 line-clamp-2 max-w-3xl text-sm leading-5">
                      {project.summary ?? project.description}
                    </p>
                    <MetaLine className="mt-2">
                      <span>
                        {project.members
                          .map((member) => displayName(member.user.fullName, member.user.username))
                          .join(", ")}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{project._count.updates} updates</span>
                      <span aria-hidden>·</span>
                      <span>{project.signatures.length} signatures</span>
                    </MetaLine>
                    {project.techStack.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {project.techStack.slice(0, 6).map((tag) => (
                          <Chip key={tag}>{tag}</Chip>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                  <div className="md:text-right">
                    <p className="text-app-ink text-sm">
                      {project.publishedAt ? formatDate(project.publishedAt) : ""}
                    </p>
                    {project.slug ? (
                      <p className="text-app-meta mt-1 truncate text-xs">/b/{project.slug}</p>
                    ) : null}
                  </div>
                  <ArrowUpRight
                    size={17}
                    strokeWidth={1.75}
                    aria-hidden
                    className="text-app-meta hidden md:block"
                  />
                </DataRow>
              );
            })
          : view === "finished" && drafts.length
            ? drafts.map((project) => {
                const verified = isProjectVerified(
                  project.members.map((member) => member.userId),
                  project.signatures,
                );
                return (
                  <DataRow key={project.id} className="flex items-center justify-between gap-4">
                    <Link href={`/projects/${project.id}`} className="group min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-app-ink text-base font-semibold group-hover:underline">
                          {project.name}
                        </h3>
                        <Chip>{verified ? "verified" : "needs attesting"}</Chip>
                      </div>
                      {project.completedAt ? (
                        <p className="text-app-meta mt-1 text-xs">
                          {formatDate(project.completedAt)}
                        </p>
                      ) : null}
                    </Link>
                    <AppButton asChild variant="secondary" size="sm">
                      <Link href={`/projects/${project.id}`}>Open</Link>
                    </AppButton>
                  </DataRow>
                );
              })
            : null}
      </DataList>
    </div>
  );
}
