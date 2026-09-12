export type EvalKind =
  | "architecture"
  | "bug"
  | "security"
  | "hallucination"
  | "hint"
  | "docs"
  | "structured";

export type EvalTask = {
  id: string;
  kind: EvalKind;
  prompt: string;
  context: string;
  mustInclude: string[];
  mustNotInclude: string[];
};

export const EVAL_TASKS: EvalTask[] = [
  {
    id: "arch-recall",
    kind: "architecture",
    prompt: "Map the architecture and name the main modules.",
    context:
      "src/app/api/checkout/route.ts handles billing.\nsrc/lib/wallet.ts stores balances.\nsrc/components/PayButton.tsx is the UI.\nThere is no src/lib/legacy-ledger.ts.",
    mustInclude: ["checkout/route.ts", "wallet.ts", "PayButton.tsx"],
    mustNotInclude: ["legacy-ledger.ts"],
  },
  {
    id: "bug-localise",
    kind: "bug",
    prompt: "Where is the off-by-one in pagination?",
    context:
      "src/lib/pages.ts: `const end = start + pageSize + 1` slices one extra row.\nsrc/lib/sort.ts only sorts names.",
    mustInclude: ["pages.ts"],
    mustNotInclude: ["sort.ts is the bug"],
  },
  {
    id: "secure-review",
    kind: "security",
    prompt: "Review this change for security issues.",
    context:
      "diff --git a/src/app/api/user/route.ts\n+ const query = `SELECT * FROM User WHERE email = '${email}'`;",
    mustInclude: ["sql", "injection"],
    mustNotInclude: [],
  },
  {
    id: "hallucination-guard",
    kind: "hallucination",
    prompt: "List every authentication provider this repo uses.",
    context: "src/lib/auth.ts uses Clerk only. No NextAuth file exists.",
    mustInclude: ["Clerk"],
    mustNotInclude: ["NextAuth", "Auth0"],
  },
  {
    id: "hint-quality",
    kind: "hint",
    prompt: "My Prisma create throws P2002 on username. Give a first hint only.",
    context: "src/lib/ensure-user.ts inserts username from Clerk if present.",
    mustInclude: ["unique", "username"],
    mustNotInclude: ["here is the full patched function"],
  },
  {
    id: "docs-draft",
    kind: "docs",
    prompt: "Draft a short README setup section.",
    context: "package.json scripts: dev, test, build. Requires DATABASE_URL and Clerk keys.",
    mustInclude: ["DATABASE_URL", "pnpm"],
    mustNotInclude: ["I have pushed this README to GitHub"],
  },
  {
    id: "structured-json",
    kind: "structured",
    prompt: "Return findings as a json array with severity, title, path, note.",
    context: "src/lib/session.ts stores JWTs in localStorage.",
    mustInclude: ["severity", "localStorage"],
    mustNotInclude: [],
  },
];

export type EvalScore = {
  id: string;
  kind: EvalKind;
  pass: boolean;
  hits: number;
  misses: number;
  leaks: number;
};

export function scoreEvalOutput(task: EvalTask, output: string): EvalScore {
  const text = output.toLowerCase();
  let hits = 0;
  let misses = 0;
  for (const needle of task.mustInclude) {
    if (text.includes(needle.toLowerCase())) hits += 1;
    else misses += 1;
  }
  let leaks = 0;
  for (const banned of task.mustNotInclude) {
    if (text.includes(banned.toLowerCase())) leaks += 1;
  }
  return {
    id: task.id,
    kind: task.kind,
    pass: misses === 0 && leaks === 0 && hits === task.mustInclude.length,
    hits,
    misses,
    leaks,
  };
}

export function summariseEvalScores(scores: EvalScore[]): { passed: number; total: number } {
  return { passed: scores.filter((score) => score.pass).length, total: scores.length };
}
