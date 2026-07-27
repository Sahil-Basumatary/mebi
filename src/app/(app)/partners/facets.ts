type TaggedUser = {
  skills: string[];
  interests: string[];
};

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function partnerFacets(pool: TaggedUser[]): {
  skills: string[];
  interests: string[];
} {
  return {
    skills: uniqueSorted(pool.flatMap((user) => user.skills)),
    interests: uniqueSorted(pool.flatMap((user) => user.interests)),
  };
}
