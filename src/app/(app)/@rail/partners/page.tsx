import { Suspense } from "react";
import { requireOnboardedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { partnerFacets } from "../../partners/facets";
import { PartnerFilters } from "../../partners/partner-filters";

export default async function PartnersRail() {
  const viewer = await requireOnboardedUser();
  const pool = await prisma.user.findMany({
    where: { onboarded: true, profilePrivate: false, id: { not: viewer.id } },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: { skills: true, interests: true },
  });
  const { skills, interests } = partnerFacets(pool);

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <p className="text-app-label text-meta font-semibold tracking-rail uppercase">Filters</p>
        <p className="text-app-body mt-3 text-body-sm leading-6">
          {pool.length
            ? "Narrow by role, skill, or interest to find the missing piece."
            : "Filters open up once other builders join the directory."}
        </p>
      </div>
      {pool.length ? (
        <Suspense fallback={null}>
          <PartnerFilters skills={skills} interests={interests} layout="stack" />
        </Suspense>
      ) : null}
    </div>
  );
}
