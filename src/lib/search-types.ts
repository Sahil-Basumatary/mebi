export type SearchHit = {
  id: string;
  label: string;
  hint: string;
  href: string;
};

export type SearchResults = {
  people: SearchHit[];
  projects: SearchHit[];
  threads: SearchHit[];
};
