import type { UserRole } from "@prisma/client";
import { Check } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import {
  Chip,
  EmptyState,
  HairlineGrid,
  PageHeader,
  Section,
} from "@/components/layout";
import { SocialIcon } from "@/components/social-icon";
import { requireOnboardedUser } from "@/lib/current-user";
import { scoreMatch, type MatchBreakdown } from "@/lib/match";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
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

function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function matchReason(breakdown: MatchBreakdown): string {
  const parts: string[] = [];
  if (breakdown.sharedSkills.length) {
    parts.push(`${breakdown.sharedSkills.length} shared skill${breakdown.sharedSkills.length > 1 ? "s" : ""}`);
  }
  if (breakdown.sharedInterests.length) {
    parts.push(
      `${breakdown.sharedInterests.length} shared interest${breakdown.sharedInterests.length > 1 ? "s" : ""}`,
    );
  }
  if (breakdown.complementaryRole) parts.push("a complementary role");
  return parts.length ? `Matched on ${joinList(parts)}.` : "A close starting point worth a look.";
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
      <span className="border-app-ink bg-app-ink text-app-paper inline-flex h-9 items-center gap-2 rounded-full border px-5 text-sm font-medium">
        <Check size={16} strokeWidth={2.5} />
        Partnered
      </span>
    );
  }

  if (relationship === "incoming") {
    return (
      <Link
        href="/inbox"
        className="border-app-ink text-app-ink hover:bg-app-ink hover:text-app-paper inline-flex h-9 items-center rounded-full border px-5 text-sm font-medium transition-colors"
      >
        Respond in inbox
      </Link>
    );
  }

  if (relationship === "outgoing") {
    return (
      <span className="border-app-divider text-app-label inline-flex h-9 items-center gap-2 rounded-full border px-5 text-sm font-medium">
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
  featured,
  relationship,
  viewerProjects,
}: {
  ranked: RankedPartner;
  featured?: boolean;
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
    <div className="bg-app-paper grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-start">
      <div className="flex gap-4">
        <div className="border-app-divider bg-app-wash text-app-label flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border text-sm font-semibold">
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            mark
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-app-ink font-semibold">{name}</p>
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
            <p className="text-app-body mt-2 line-clamp-2 max-w-2xl text-body leading-6">{user.bio}</p>
          ) : null}
          {featured ? (
            <p className="text-app-ink mt-2 text-body">{matchReason(breakdown)}</p>
          ) : null}
          {skillTags.length || interestTags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
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
      <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
        {breakdown.score > 0 ? (
          <span className="text-app-label font-mono text-chip tracking-chip">
            {breakdown.sharedSkills.length + breakdown.sharedInterests.length} SHARED
          </span>
        ) : null}
        <PartnerAction ranked={ranked} relationship={relationship} viewerProjects={viewerProjects} />
      </div>
    </div>
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
  const filtersActive = Boolean(query || roleFilter || skillFilter || interestFilter);

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

  // Pull the viewer's existing connections so each row shows the right action
  // (request, sent, respond, or partnered) instead of letting people fire
  // duplicate requests into a void.
  const [partnerships, pendingRequests, viewerProjects] = await Promise.all([
    prisma.partnership.findMany({
      where: { OR: [{ userAId: viewer.id }, { userBId: viewer.id }] },
      select: { userAId: true, userBId: true },
    }),
    prisma.partnershipRequest.findMany({
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

  const partneredIds = new Set(
    partnerships.map((p) => (p.userAId === viewer.id ? p.userBId : p.userAId)),
  );
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
    if (skillFilter && !user.skills.some((skill) => skill.toLowerCase() === skillFilter.toLowerCase())) {
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

  const poolWithOverlap = pool.filter((user) => scoreMatch(viewer, user).score > 0).length;
  const { skills, interests } = partnerFacets(pool);
  const overlapping = ranked.filter((item) => item.breakdown.score > 0);
  const featuredIds = new Set(
    !filtersActive
      ? (overlapping.length ? overlapping : ranked).slice(0, 3).map((item) => item.user.id)
      : [],
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Find a Partner"
        title="Find serious builders for the missing role."
        description="Discovery starts from overlap, not noise. Skills and interests you share are highlighted, and complementary roles are nudged up the list."
        aside={
          <>
            <p className="text-app-label text-eyebrow font-semibold tracking-eyebrow uppercase">
              In your network
            </p>
            <div className="bg-app-divider mt-6 grid grid-cols-2 gap-px">
              <div className="bg-app-chip pr-4">
                <p className="text-app-ink font-serif text-4xl font-light">{pool.length}</p>
                <p className="text-app-label mt-2 text-eyebrow font-semibold tracking-eyebrow uppercase">
                  Builders
                </p>
              </div>
              <div className="bg-app-chip pl-4">
                <p className="text-app-ink font-serif text-4xl font-light">{poolWithOverlap}</p>
                <p className="text-app-label mt-2 text-eyebrow font-semibold tracking-eyebrow uppercase">
                  Share your tags
                </p>
              </div>
            </div>
          </>
        }
      />

      {pool.length === 0 ? (
        <EmptyState
          eyebrow="Early network"
          title="No other builders yet"
          description="You are early. As more KCL students onboard, this surface fills with people whose skills and interests overlap with yours."
        />
      ) : (
        <>
          {/* The rail only exists from xl up, so the same filters render inline
              below it. display:none keeps the unused copy out of the a11y tree. */}
          <Suspense fallback={null}>
            <PartnerFilters skills={skills} interests={interests} className="xl:hidden" />
          </Suspense>

          <Section
            eyebrow={filtersActive ? "Search results" : "Directory"}
            title={`${ranked.length} ${ranked.length === 1 ? "builder" : "builders"}`}
          >
            {ranked.length ? (
              <HairlineGrid>
                {ranked.map((item) => (
                  <PartnerRow
                    key={item.user.id}
                    ranked={item}
                    featured={featuredIds.has(item.user.id)}
                    relationship={relationshipFor(item.user.id)}
                    viewerProjects={viewerProjects}
                  />
                ))}
              </HairlineGrid>
            ) : (
              <EmptyState
                eyebrow="No matches"
                title="No builders match these filters"
                description="Try widening the role or clearing a tag."
              />
            )}
          </Section>
        </>
      )}
    </div>
  );
}
