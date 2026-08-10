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
    <div className="flex flex-col gap-4">
      <p className="text-app-label text-meta font-semibold tracking-rail uppercase">Filters</p>
      {!pool.length ? (
        <p className="text-app-meta text-sm">No builders yet.</p>
      ) : (
        <Suspense fallback={null}>
          <PartnerFilters skills={skills} interests={interests} layout="stack" />
        </Suspense>
      )}
    </div>
  );
}
