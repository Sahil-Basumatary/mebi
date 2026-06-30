import type { UserRole } from "@prisma/client";
import { Check } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireOnboardedUser } from "@/lib/current-user";
import { scoreMatch, type MatchBreakdown } from "@/lib/match";
import { prisma } from "@/lib/prisma";
import { PartnerFilters } from "./partner-filters";
import { PartnerRequestDialog } from "./partner-request-dialog";

type Relationship = "none" | "outgoing" | "incoming" | "partnered";

type ViewerProject = {
  id: string;
  name: string;
};

const ROLE_LABEL: Record<UserRole, string> = {
  BUILDER: "Builder",
  SPECIALIST: "Specialist",
  LEARNER: "Learner",
};

type PartnerProfile = {
  id: string;
  fullName: string | null;
  username: string | null;
  bio: string | null;
  imageUrl: string | null;
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

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function displayName(user: PartnerProfile): string {
  return user.fullName || user.username || "KCL builder";
}

function initials(user: PartnerProfile): string {
  const base = user.fullName || user.username || "K B";
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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

function Tag({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <span
      className={
        highlight
          ? "border border-[#000000] bg-[#000000] px-2 py-0.5 text-[11px] text-[#ffffff]"
          : "border border-[#d8d8d8] bg-[#f4f4f4] px-2 py-0.5 text-[11px] text-[#555555]"
      }
    >
      {label}
    </span>
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

  if (relationship === "partnered") {
    return (
      <span className="inline-flex h-9 items-center gap-2 rounded-full border border-[#000000] bg-[#000000] px-5 text-sm font-medium text-[#ffffff]">
        <Check size={16} strokeWidth={2.5} />
        Partnered
      </span>
    );
  }

  if (relationship === "incoming") {
    return (
      <Link
        href="/inbox"
        className="inline-flex h-9 items-center rounded-full border border-[#000000] px-5 text-sm font-medium text-[#000000] transition-colors hover:bg-[#000000] hover:text-[#ffffff]"
      >
        Respond in inbox
      </Link>
    );
  }

  if (relationship === "outgoing") {
    return (
      <span className="inline-flex h-9 items-center gap-2 rounded-full border border-[#d8d8d8] px-5 text-sm font-medium text-[#555555]">
        <Check size={16} strokeWidth={2} />
        Request sent
      </span>
    );
  }

  return (
    <PartnerRequestDialog
      toUserId={user.id}
      toName={displayName(user)}
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
  const sharedSkillSet = new Set(breakdown.sharedSkills.map((tag) => tag.toLowerCase()));
  const sharedInterestSet = new Set(breakdown.sharedInterests.map((tag) => tag.toLowerCase()));
  const skillTags = user.skills.slice(0, 5);
  const interestTags = user.interests.slice(0, 4);

  return (
    <div className="grid gap-5 bg-[#ffffff] p-6 lg:grid-cols-[1fr_auto] lg:items-start">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d8d8d8] bg-[#f4f4f4] text-sm font-semibold text-[#555555]">
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt={displayName(user)} className="h-full w-full object-cover" />
          ) : (
            initials(user)
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-semibold">{displayName(user)}</p>
            {user.username ? <span className="text-sm text-[#999999]">@{user.username}</span> : null}
            {user.role ? (
              <span className="border border-[#d8d8d8] bg-[#f4f4f4] px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-[#555555] uppercase">
                {ROLE_LABEL[user.role]}
              </span>
            ) : null}
          </div>
          {user.bio ? <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-[#333333]">{user.bio}</p> : null}
          {featured ? <p className="mt-2 text-sm text-[#111111]">{matchReason(breakdown)}</p> : null}
          {skillTags.length || interestTags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {skillTags.map((skill) => (
                <Tag key={`s-${skill}`} label={skill} highlight={sharedSkillSet.has(skill.toLowerCase())} />
              ))}
              {interestTags.map((interest) => (
                <Tag
                  key={`i-${interest}`}
                  label={interest}
                  highlight={sharedInterestSet.has(interest.toLowerCase())}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
        {breakdown.score > 0 ? (
          <span className="font-mono text-[11px] tracking-[0.16em] text-[#555555]">
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
    where: { onboarded: true, id: { not: viewer.id } },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      fullName: true,
      username: true,
      bio: true,
      imageUrl: true,
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
      where: { ownerId: viewer.id, status: "ACTIVE" },
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

  const skillFacets = uniqueSorted(pool.flatMap((user) => user.skills));
  const interestFacets = uniqueSorted(pool.flatMap((user) => user.interests));

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

  const overlapping = ranked.filter((item) => item.breakdown.score > 0);
  const recommended = (overlapping.length ? overlapping : ranked).slice(0, 3);
  const hasExactRecommendations = overlapping.length > 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="grid gap-px border border-[#d8d8d8] bg-[#d8d8d8] xl:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-[#ffffff] p-8 lg:p-10">
            <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
              Find a Partner
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.5rem,5vw,4.8rem)] leading-[0.98] font-light tracking-[-0.04em]">
              Find serious builders for the missing role.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#333333]">
              Discovery starts from overlap, not noise. Skills and interests you share are highlighted,
              and complementary roles are nudged up the list.
            </p>
          </div>
          <div className="flex flex-col justify-between bg-[#f4f4f4] p-8 lg:p-10">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">In your network</p>
            <div className="mt-6 grid grid-cols-2 gap-px bg-[#d8d8d8]">
              <div className="bg-[#f4f4f4] pr-4">
                <p className="font-serif text-4xl font-light">{pool.length}</p>
                <p className="mt-2 text-[11px] font-semibold tracking-[0.18em] text-[#555555] uppercase">
                  Builders
                </p>
              </div>
              <div className="bg-[#f4f4f4] pl-4">
                <p className="font-serif text-4xl font-light">{poolWithOverlap}</p>
                <p className="mt-2 text-[11px] font-semibold tracking-[0.18em] text-[#555555] uppercase">
                  Share your tags
                </p>
              </div>
            </div>
          </div>
        </header>

        <PartnerFilters skills={skillFacets} interests={interestFacets} />

        {pool.length === 0 ? (
          <section className="border border-[#d8d8d8] bg-[#f7f7f7] p-8">
            <h2 className="font-serif text-2xl font-light">No other builders yet</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#333333]">
              You are early. As more KCL students onboard, this surface fills with people whose skills and
              interests overlap with yours.
            </p>
          </section>
        ) : (
          <>
            {!filtersActive && recommended.length ? (
              <section className="border border-[#d8d8d8] bg-[#ffffff]">
                <div className="flex items-end justify-between gap-4 border-b border-[#d8d8d8] p-6">
                  <div>
                    <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
                      Recommended matches
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-light">
                      {hasExactRecommendations ? "Closest to your stack" : "No exact matches yet"}
                    </h2>
                  </div>
                </div>
                {!hasExactRecommendations ? (
                  <p className="border-b border-[#d8d8d8] bg-[#f7f7f7] px-6 py-4 text-sm leading-6 text-[#333333]">
                    Nothing overlaps your tags directly, so here {recommended.length === 1 ? "is" : "are"}{" "}
                    {recommended.length} close starting point{recommended.length > 1 ? "s" : ""} to reach out to.
                  </p>
                ) : null}
                <div className="grid gap-px bg-[#d8d8d8]">
                  {recommended.map((item) => (
                    <PartnerRow
                      key={item.user.id}
                      ranked={item}
                      featured
                      relationship={relationshipFor(item.user.id)}
                      viewerProjects={viewerProjects}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="border border-[#d8d8d8] bg-[#ffffff]">
              <div className="flex items-end justify-between gap-4 border-b border-[#d8d8d8] p-6">
                <div>
                  <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">
                    {filtersActive ? "Search results" : "Full directory"}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-light">
                    {ranked.length} {ranked.length === 1 ? "builder" : "builders"}
                  </h2>
                </div>
              </div>
              {ranked.length ? (
                <div className="grid gap-px bg-[#d8d8d8]">
                  {ranked.map((item) => (
                    <PartnerRow
                      key={item.user.id}
                      ranked={item}
                      relationship={relationshipFor(item.user.id)}
                      viewerProjects={viewerProjects}
                    />
                  ))}
                </div>
              ) : (
                <p className="bg-[#f7f7f7] px-6 py-8 text-sm leading-6 text-[#333333]">
                  No builders match these filters. Try widening the role or clearing a tag.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
