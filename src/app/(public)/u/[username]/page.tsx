import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chip } from "@/components/layout";
import { resolveTimezone } from "@/lib/locale";
import {
  getPublicForumThreads,
  getPublicProfileByUsername,
  getPublishedBuildsForUser,
} from "@/lib/public-profile";
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
    return { title: "Profile not found · mebi" };
  }

  const name = displayName(profile.fullName, profile.username);
  const title = `${name} · mebi`;
  const description = profile.bio || `Published builds by ${name} on mebi.`;

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

  return (
    <div className="flex flex-col gap-10">
      <header className="border-app-divider bg-app-paper border px-6 py-8 sm:px-10 sm:py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {profile.imageUrl ? (
            <img
              src={profile.imageUrl}
              alt=""
              className="border-app-divider h-24 w-24 border object-cover"
            />
          ) : (
            <span className="border-app-divider bg-app-wash text-app-label flex h-24 w-24 items-center justify-center border font-mono text-lg tracking-meta">
              {name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
              Profile
            </p>
            <h1 className="mt-3 font-serif text-5xl font-light tracking-tight">{name}</h1>
            {profile.username ? (
              <p className="text-app-meta mt-2 font-mono text-sm tracking-meta">
                @{profile.username}
              </p>
            ) : null}
            {profile.bio ? (
              <p className="text-app-body mt-5 max-w-2xl text-body leading-7">{profile.bio}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.role ? <Chip tone="ink">{profile.role.toLowerCase()}</Chip> : null}
              {profile.skills.slice(0, 6).map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </div>
            {connectionLinks.length ? (
              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                {connectionLinks.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-app-ink text-sm font-medium underline underline-offset-2"
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
            <dl className="text-app-meta mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-chip tracking-meta uppercase">
              <div>
                <dt className="sr-only">Published ships</dt>
                <dd>{stats.publishedCount} ships</dd>
              </div>
              <div>
                <dt className="sr-only">Verified ships</dt>
                <dd>{stats.verifiedPublishedCount} verified</dd>
              </div>
              <div>
                <dt className="sr-only">Peer signatures</dt>
                <dd>{stats.attestationsReceived} attested</dd>
              </div>
              <div>
                <dt className="sr-only">Current streak</dt>
                <dd>{stats.currentStreak}-day streak</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl font-light">Badges</h2>
          <Link
            href="/leaderboard"
            className="text-app-ink shrink-0 text-sm font-medium underline underline-offset-2"
          >
            Leaderboard
          </Link>
        </div>
        {badges.length ? (
          <ul className="border-app-divider mt-5 grid gap-px border sm:grid-cols-2">
            {badges.map((badge) => (
              <li key={badge.id} className="bg-app-paper flex flex-col gap-2 p-5">
                <div className="flex items-center gap-2">
                  <Chip tone={TIER_TONE[badge.tier] ?? "wash"}>{badge.tier}</Chip>
                  <p className="text-app-label font-mono text-chip tracking-meta uppercase">
                    {badge.category}
                  </p>
                </div>
                <h3 className="text-app-ink font-serif text-2xl font-light">{badge.label}</h3>
                <p className="text-app-body text-body-sm leading-6">{badge.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-app-body mt-5 text-body-sm leading-6">
            No badges yet. Publish, get attested, and keep a real build log.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-serif text-3xl font-light">Forum</h2>
        {threads.length ? (
          <ul className="border-app-divider mt-5 divide-y border">
            {threads.map((thread) => (
              <li key={thread.id} className="bg-app-paper px-5 py-5">
                <Link href={`/forum/${thread.board.slug}/${thread.id}`} className="group block">
                  <p className="text-app-meta font-mono text-chip tracking-meta uppercase">
                    {thread.board.title}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-light group-hover:underline">
                    {thread.title}
                  </h3>
                  <p className="text-app-meta mt-2 font-mono text-chip tracking-meta uppercase">
                    {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
                    {thread.tags.length ? ` · ${thread.tags.join(" · ")}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-app-body mt-5 text-body-sm leading-6">No forum threads yet.</p>
        )}
      </section>

      <section>
        <h2 className="font-serif text-3xl font-light">Published builds</h2>
        {builds.length ? (
          <ul className="border-app-divider mt-5 divide-y border">
            {builds.map((build) => (
              <li key={build.id} className="bg-app-paper px-5 py-5">
                <Link href={`/b/${build.slug}`} className="group block">
                  <h3 className="font-serif text-2xl font-light group-hover:underline">
                    {build.name}
                  </h3>
                  {build.summary ? (
                    <p className="text-app-body mt-2 max-w-2xl text-body-sm leading-6">
                      {build.summary}
                    </p>
                  ) : null}
                  <p className="text-app-meta mt-3 font-mono text-chip tracking-meta uppercase">
                    {formatDate(build.publishedAt)}
                    {build.members.length
                      ? ` · ${build.members.length} builder${build.members.length === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-app-body mt-5 text-body-sm leading-6">
            No published builds yet.
          </p>
        )}
      </section>
    </div>
  );
}
