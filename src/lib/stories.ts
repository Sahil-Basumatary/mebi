export type Story = {
  category: string;
  date: string;
  title: string;
  // Path under /public, added once a real cover is uploaded. Until then both the
  // homepage grid and the dashboard node cards fall back to a shared placeholder.
  image?: string;
};

// Single source of truth so the marketing homepage and the in-product hover cards
// always tell the exact same story.
export const FEATURED_STORIES: Story[] = [
  {
    category: "Product",
    date: "Coming soon",
    title: "How a three-person KCL team could ship a fintech prototype in a single term.",
  },
  {
    category: "Builders",
    date: "Coming soon",
    title: "From a half-formed idea to a structured request that the right specialist answers.",
  },
  {
    category: "Outcomes",
    date: "Coming soon",
    title: "Turning a finished project into the story you actually tell in a spring week interview.",
  },
];
