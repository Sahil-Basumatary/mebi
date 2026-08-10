import { redirect } from "next/navigation";

type LegacyStandingsProps = {
  searchParams: Promise<{ board?: string }>;
};

export default async function LegacyStandingsRedirect({ searchParams }: LegacyStandingsProps) {
  const params = await searchParams;
  const board = params.board ? `?board=${encodeURIComponent(params.board)}` : "";
  redirect(`/leaderboard${board}`);
}
