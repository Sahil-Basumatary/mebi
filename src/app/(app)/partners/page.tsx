import type { UserRole } from "@prisma/client";
import { Check } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Chip, DataList, DataRow, EmptyState, ListColumns, PageHeader } from "@/components/layout";
import { SocialIcon } from "@/components/social-icon";
import { AppButton } from "@/components/ui/app-button";
import { requireOnboardedUser } from "@/lib/current-user";
import { scoreMatch, type MatchBreakdown } from "@/lib/match";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { detectPlatform, platformLabel } from "@/lib/social-links";
import { displayName, initials, ROLE_LABEL } from "@/lib/user-display";
import { partnerFacets } from "./facets";
import { PartnerFilters } from "./partner-filters";
import { PartnerRequestDialog } from "./partner-request-dialog";

type Relationship = "none" | "outgoing" | "incoming" | "partnered";

type ViewerProject = {
  id: string;
  name: string;
};

type PartnerProfile = {
  id: string;
  fullName: string | null;
  username: string | null;
  bio: string | null;
  pronouns: string | null;
  imageUrl: string | null;
  githubUsername: string | null;
  showGithub: boolean;
  socialLinks: string[];
  skills: string[];
  interests: string[];
  role: UserRole | null;
};

type RankedPartner = {
  user: PartnerProfile;
  breakdown: MatchBreakdown;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function asRole(value: string): UserRole | null {
  return value === "BUILDER" || value === "SPECIALIST" || value === "LEARNER" ? value : null;
}

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function PartnerAction({
  ranked,
  relationship,
  viewerProjects,
}: {
  ranked: RankedPartner;
  relationship: Relationship;
  viewerProjects: ViewerProject[];
}) {
  const { user, breakdown } = ranked;
  const name = displayName(user.fullName, user.username);

  if (relationship === "partnered") {
    return (
      <span className="border-app-ink bg-app-ink text-app-paper inline-flex h-8 items-center gap-2 border px-3 text-xs font-medium">
        <Check size={16} strokeWidth={2.5} />
        On a build
      </span>
    );
  }

  if (relationship === "incoming") {
    return (
      <AppButton asChild variant="secondary" size="sm">
        <Link href="/inbox">Respond</Link>
      </AppButton>
    );
  }

  if (relationship === "outgoing") {
    return (
      <span className="border-app-divider text-app-label inline-flex h-8 items-center gap-2 border px-3 text-xs font-medium">
        <Check size={16} strokeWidth={2} />
        Request sent
      </span>
    );
  }

  return (
    <PartnerRequestDialog
      toUserId={user.id}
      toName={name}
      sharedSkills={breakdown.sharedSkills}
      sharedInterests={breakdown.sharedInterests}
      projects={viewerProjects}
    />
  );
}

function PartnerRow({
  ranked,
  relationship,
  viewerProjects,
}: {
  ranked: RankedPartner;
  relationship: Relationship;
  viewerProjects: ViewerProject[];
}) {
  const { user, breakdown } = ranked;
  const name = displayName(user.fullName, user.username);
  const mark = initials(user.fullName, user.username);
  const sharedSkillSet = new Set(breakdown.sharedSkills.map((tag) => tag.toLowerCase()));
  const sharedInterestSet = new Set(breakdown.sharedInterests.map((tag) => tag.toLowerCase()));
  const skillTags = user.skills.slice(0, 5);
  const interestTags = user.interests.slice(0, 4);

  return (
    <DataRow className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_7rem_9rem] lg:items-center">
      <div className="flex min-w-0 gap-3">
        <div className="border-app-divider bg-app-wash text-app-label flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-semibold">
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            mark
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-app-ink text-[15px] font-semibold">{name}</p>
            {user.username ? <span className="text-app-meta text-sm">@{user.username}</span> : null}
            {user.pronouns ? <span className="text-app-meta text-sm">{user.pronouns}</span> : null}
            {user.githubUsername && user.showGithub ? (
              <a
                href={`https://github.com/${user.githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="text-app-label hover:text-app-ink inline-flex items-center gap-1 text-sm transition-colors"
              >
                <GithubMark className="h-3.5 w-3.5" />
                {user.githubUsername}
              </a>
            ) : null}
            {user.socialLinks.length ? (
              <span className="flex items-center gap-2">
                {user.socialLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${platformLabel(detectPlatform(link))} profile`}
                    className="text-app-label hover:text-app-ink transition-colors"
                  >
                    <SocialIcon url={link} className="h-4 w-4" />
                  </a>
                ))}
              </span>
            ) : null}
            {user.role ? <Chip>{ROLE_LABEL[user.role]}</Chip> : null}
          </div>
          {user.bio ? (
            <p className="text-app-body mt-1 line-clamp-2 max-w-3xl text-sm leading-5">
              {user.bio}
            </p>
          ) : null}
          {skillTags.length || interestTags.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skillTags.map((skill) => (
                <Chip
                  key={`s-${skill}`}
                  tone={sharedSkillSet.has(skill.toLowerCase()) ? "ink" : "wash"}
                >
                  {skill}
                </Chip>
              ))}
              {interestTags.map((interest) => (
                <Chip
                  key={`i-${interest}`}
                  tone={sharedInterestSet.has(interest.toLowerCase()) ? "ink" : "wash"}
                >
                  {interest}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <span className="text-app-meta font-mono text-[11px] tracking-[0.08em] uppercase lg:text-right">
        {breakdown.score > 0
          ? `${breakdown.sharedSkills.length + breakdown.sharedInterests.length} shared`
          : "—"}
      </span>
      <div className="flex lg:justify-end">
        <PartnerAction
          ranked={ranked}
          relationship={relationship}
          viewerProjects={viewerProjects}
        />
      </div>
    </DataRow>
  );
}

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await requireOnboardedUser();
  const params = await searchParams;
  const query = first(params.q).trim().toLowerCase();
  const roleFilter = asRole(first(params.role));
  const skillFilter = first(params.skill);
  const interestFilter = first(params.interest);

  // Early-stage scale: pull the candidate pool once and rank in memory. When the
  // directory grows we move structured filters and pagination into the query.
  const pool: PartnerProfile[] = await prisma.user.findMany({
    where: { onboarded: true, profilePrivate: false, id: { not: viewer.id } },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      fullName: true,
      username: true,
      bio: true,
      pronouns: true,
      imageUrl: true,
      githubUsername: true,
      showGithub: true,
      socialLinks: true,
      skills: true,
      interests: true,
      role: true,
    },
  });

  // Co-membership is the new "partnered" signal. Pending project requests still
  // gate the invite button so people don't spam the same build.
  const [coMembers, pendingRequests, viewerProjects] = await Promise.all([
    prisma.projectMember.findMany({
      where: {
        userId: { not: viewer.id },
        project: { members: { some: { userId: viewer.id } } },
      },
      select: { userId: true },
    }),
    prisma.projectRequest.findMany({
      where: {
        status: "PENDING",
        OR: [{ fromUserId: viewer.id }, { toUserId: viewer.id }],
      },
      select: { fromUserId: true, toUserId: true },
    }),
    prisma.project.findMany({
      where: { ...memberProjectWhere(viewer.id), status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  const partneredIds = new Set(coMembers.map((member) => member.userId));
  const outgoingIds = new Set<string>();
  const incomingIds = new Set<string>();
  for (const request of pendingRequests) {
    if (request.fromUserId === viewer.id) outgoingIds.add(request.toUserId);
    else incomingIds.add(request.fromUserId);
  }

  function relationshipFor(userId: string): Relationship {
    if (partneredIds.has(userId)) return "partnered";
    if (outgoingIds.has(userId)) return "outgoing";
    if (incomingIds.has(userId)) return "incoming";
    return "none";
  }

  const filtered = pool.filter((user) => {
    if (roleFilter && user.role !== roleFilter) return false;
    if (
      skillFilter &&
      !user.skills.some((skill) => skill.toLowerCase() === skillFilter.toLowerCase())
    ) {
      return false;
    }
    if (
      interestFilter &&
      !user.interests.some((interest) => interest.toLowerCase() === interestFilter.toLowerCase())
    ) {
      return false;
    }
    if (query) {
      const haystack = [user.fullName, user.username, user.bio, ...user.skills, ...user.interests]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const ranked: RankedPartner[] = filtered
    .map((user) => ({ user, breakdown: scoreMatch(viewer, user) }))
    .sort((a, b) => b.breakdown.score - a.breakdown.score);

  const { skills, interests } = partnerFacets(pool);
  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        density="compact"
        eyebrow="Network"
        title="Partners"
        description="Find builders for active projects."
      />
      <DataList
        ariaLabel="Builders"
        toolbar={
          pool.length ? (
            <Suspense fallback={<div className="h-20" />}>
              <PartnerFilters skills={skills} interests={interests} resultCount={ranked.length} />
            </Suspense>
          ) : null
        }
        columns={
          ranked.length ? (
            <ListColumns className="grid-cols-[minmax(0,1fr)_7rem_9rem]">
              <span>Builder</span>
              <span className="text-right">Shared</span>
              <span className="text-right">Action</span>
            </ListColumns>
          ) : null
        }
        empty={
          <EmptyState
            variant="inline"
            eyebrow={pool.length ? "No matches" : "Early network"}
            title={pool.length ? "No builders match these filters." : "No other builders yet."}
            action={
              pool.length ? undefined : (
                <AppButton asChild>
                  <Link href="/projects">Start a build</Link>
                </AppButton>
              )
            }
          />
        }
      >
        {ranked.length
          ? ranked.map((item) => (
              <PartnerRow
                key={item.user.id}
                ranked={item}
                relationship={relationshipFor(item.user.id)}
                viewerProjects={viewerProjects}
              />
            ))
          : null}
      </DataList>
    </div>
  );
}
