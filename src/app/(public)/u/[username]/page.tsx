import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chip, DataList, DataRow, EmptyState, MetaLine, PanelHeader } from "@/components/layout";
import { resolveTimezone } from "@/lib/locale";
import { isProjectVerified } from "@/lib/proof";
import {
  getPublicForumThreads,
  getPublicProfileByUsername,
  getPublishedBuildsForUser,
} from "@/lib/public-profile";
import { detectPlatform, platformLabel } from "@/lib/social-links";
import { getBadgesForUser } from "@/lib/standings";
import { displayName } from "@/lib/user-display";

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

const TIER_TONE: Record<string, "ink" | "wash"> = {
  bronze: "wash",
  silver: "wash",
  gold: "ink",
  platinum: "ink",
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  if (!profile) {
    return { title: "Profile not found · Hackollab" };
  }

  const name = displayName(profile.fullName, profile.username);
  const title = `${name} · Hackollab`;
  const description = profile.bio || `Published projects by ${name} on Hackollab.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  if (!profile) notFound();

  const [builds, recognition, threads] = await Promise.all([
    getPublishedBuildsForUser(profile.id),
    getBadgesForUser(profile.id, resolveTimezone(profile.timezone)),
    getPublicForumThreads(profile.id),
  ]);
  const name = displayName(profile.fullName, profile.username);
  const { badges, stats } = recognition;
  const identityMeta = [
    stats.publishedCount > 0 ? `${stats.publishedCount} published` : null,
    stats.verifiedPublishedCount > 0 ? `${stats.verifiedPublishedCount} verified` : null,
    stats.attestationsReceived > 0 ? `${stats.attestationsReceived} attested` : null,
    stats.currentStreak > 0 ? `${stats.currentStreak}d streak` : null,
  ].filter((item): item is string => Boolean(item));
  const connectionLinks: { label: string; href: string | null }[] = [];
  if (profile.githubUsername && profile.showGithub) {
    connectionLinks.push({
      label: `GitHub @${profile.githubUsername}`,
      href: `https://github.com/${profile.githubUsername}`,
    });
  }
  if (profile.linkedinUrl && profile.showLinkedin) {
    connectionLinks.push({ label: "LinkedIn", href: profile.linkedinUrl });
  }
  if (profile.discordHandle && profile.showDiscord) {
    connectionLinks.push({
      label: profile.discordHandle.startsWith("http")
        ? "Discord"
        : `Discord @${profile.discordHandle}`,
      href: profile.discordHandle.startsWith("http") ? profile.discordHandle : null,
    });
  }
  if (profile.calendarUrl && profile.showCalendar) {
    connectionLinks.push({ label: "Calendar", href: profile.calendarUrl });
  }
  for (const url of profile.socialLinks) {
    if (connectionLinks.some((link) => link.href === url)) continue;
    connectionLinks.push({ label: platformLabel(detectPlatform(url)), href: url });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="border-app-divider bg-app-paper border">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start">
          {profile.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.imageUrl}
              alt=""
              className="border-app-divider h-16 w-16 border object-cover"
            />
          ) : (
            <span className="border-app-divider bg-app-wash text-app-label tracking-meta flex h-16 w-16 items-center justify-center border font-mono text-sm">
              {name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
              Builder
            </p>
            <h1 className="text-app-ink mt-1 text-[1.75rem] leading-tight font-medium sm:text-[2rem]">
              {name}
            </h1>
            {profile.username ? (
              <p className="text-app-meta mt-1 text-sm">@{profile.username}</p>
            ) : null}
            {identityMeta.length ? (
              <MetaLine className="mt-2">
                {identityMeta.map((item, index) => (
                  <span key={item}>
                    {index > 0 ? <span aria-hidden> · </span> : null}
                    {item}
                  </span>
                ))}
              </MetaLine>
            ) : null}
            {profile.bio ? (
              <p className="text-app-body mt-3 max-w-2xl text-sm leading-6">{profile.bio}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.role ? <Chip tone="ink">{profile.role.toLowerCase()}</Chip> : null}
              {profile.skills.slice(0, 6).map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
              {profile.interests.slice(0, 4).map((interest) => (
                <Chip key={interest} tone="paper">
                  {interest}
                </Chip>
              ))}
            </div>
            {connectionLinks.length ? (
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {connectionLinks.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-app-link text-sm font-medium underline underline-offset-2"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <span className="text-app-body text-sm">{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </header>

      <DataList
        ariaLabel="Published projects"
        toolbar={
          <PanelHeader
            eyebrow="Portfolio"
            title="Published projects"
            action={
              builds.length ? (
                <span className="text-app-meta text-sm tabular-nums">{builds.length}</span>
              ) : null
            }
          />
        }
        empty={
          <EmptyState
            variant="inline"
            eyebrow="Nothing published"
            title="No published projects yet."
          />
        }
      >
        {builds.length
          ? builds.map((build) => {
              const verified = isProjectVerified(
                build.members.map((member) => member.userId),
                build.signatures,
              );
              return (
                <DataRow key={build.id}>
                  <Link href={`/b/${build.slug}`} className="group block">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-app-ink group-hover:text-app-link text-base font-semibold">
                        {build.name}
                      </h3>
                      <Chip tone="ink">{verified ? "verified" : "self-attested"}</Chip>
                    </div>
                    {build.summary ? (
                      <p className="text-app-body mt-1 line-clamp-2 max-w-3xl text-sm leading-5">
                        {build.summary}
                      </p>
                    ) : null}
                    <MetaLine className="mt-2">
                      <span>{formatDate(build.publishedAt)}</span>
                      <span aria-hidden>·</span>
                      <span>
                        {build.members.length} builder
                        {build.members.length === 1 ? "" : "s"}
                      </span>
                      {build.techStack.length ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>{build.techStack.slice(0, 4).join(" · ")}</span>
                        </>
                      ) : null}
                    </MetaLine>
                  </Link>
                </DataRow>
              );
            })
          : null}
      </DataList>

      <DataList
        ariaLabel="Badges"
        toolbar={
          <PanelHeader
            eyebrow="Recognition"
            title="Badges"
            action={
              badges.length ? (
                <span className="text-app-meta text-sm tabular-nums">{badges.length}</span>
              ) : null
            }
          />
        }
        empty={<EmptyState variant="inline" eyebrow="No badges" title="No badges yet." />}
      >
        {badges.length
          ? badges.map((badge) => (
              <DataRow key={badge.id}>
                <div className="flex items-center gap-2">
                  <Chip tone={TIER_TONE[badge.tier] ?? "wash"}>{badge.tier}</Chip>
                  <span className="text-app-meta text-xs uppercase">{badge.category}</span>
                </div>
                <h3 className="text-app-ink mt-1 text-base font-semibold">{badge.label}</h3>
                <p className="text-app-body mt-1 text-sm leading-5">{badge.description}</p>
              </DataRow>
            ))
          : null}
      </DataList>

      <DataList
        ariaLabel="Forum threads"
        toolbar={
          <PanelHeader
            eyebrow="Discussion"
            title="Forum"
            action={
              threads.length ? (
                <span className="text-app-meta text-sm tabular-nums">{threads.length}</span>
              ) : null
            }
          />
        }
        empty={<EmptyState variant="inline" eyebrow="Quiet" title="No forum threads yet." />}
      >
        {threads.length
          ? threads.map((thread) => (
              <DataRow key={thread.id}>
                <Link href={`/forum/${thread.board.slug}/${thread.id}`} className="group block">
                  <p className="text-app-meta text-xs uppercase">{thread.board.title}</p>
                  <h3 className="text-app-ink group-hover:text-app-link mt-1 text-base font-semibold">
                    {thread.title}
                  </h3>
                  <MetaLine className="mt-2">
                    <span>
                      {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
                    </span>
                    {thread.tags.length ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>{thread.tags.join(" · ")}</span>
                      </>
                    ) : null}
                  </MetaLine>
                </Link>
              </DataRow>
            ))
          : null}
      </DataList>
    </div>
  );
}
