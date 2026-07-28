import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chip } from "@/components/layout";
import {
  getPublicProfileByUsername,
  getPublishedBuildsForUser,
} from "@/lib/public-profile";
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

  const builds = await getPublishedBuildsForUser(profile.id);
  const name = displayName(profile.fullName, profile.username);

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
              Public builder
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
          </div>
        </div>
      </header>

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
