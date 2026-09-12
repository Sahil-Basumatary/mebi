import type { AiDocumentKind } from "@prisma/client";
import { wrapUntrusted } from "@/lib/ai/untrusted";

export function architecturePrompt(facts: string): string {
  return [
    "Write an architecture map from the repository facts only.",
    "Cite file paths that actually appear in the facts. Do not invent files.",
    "Use sections: Overview, Key modules (with paths), Data flow, Tests and risks.",
    wrapUntrusted("REPO_FACTS", facts),
  ].join("\n\n");
}

export function commitReviewPrompt(input: { message: string; diff: string; facts: string }): string {
  return [
    "Review this commit for correctness, security, and missing tests.",
    "Prefer specific file paths. Do not complete assessed coursework.",
    "After the markdown review, output a json fence with an array of {severity, title, path, note}.",
    "severity must be high, medium, or low.",
    wrapUntrusted("COMMIT_MESSAGE", input.message),
    wrapUntrusted("DIFF", input.diff),
    wrapUntrusted("REPO_FACTS", input.facts),
  ].join("\n\n");
}

export function hintPrompt(input: {
  question: string;
  step: number;
  mistakes: string;
  facts: string;
}): string {
  const stepGuide =
    input.step <= 1
      ? "Step 1 of 3: ask a guiding question and name one file or concept to inspect. Do not give the fix."
      : input.step === 2
        ? "Step 2 of 3: point at the likely location and the class of mistake. Still do not paste a full solution."
        : "Step 3 of 3: outline a partial approach the student can finish. Do not write the complete assessed solution.";
  return [
    stepGuide,
    "Use prior mistake categories if they are relevant.",
    wrapUntrusted("MISTAKE_HISTORY", input.mistakes || "None recorded."),
    wrapUntrusted("REPO_FACTS", input.facts),
    wrapUntrusted("STUDENT_QUESTION", input.question),
  ].join("\n\n");
}

export function docsPrompt(kind: AiDocumentKind, facts: string): string {
  const target =
    kind === "README"
      ? "Draft a README.md the student can copy. Include purpose, setup, and how to run."
      : kind === "ADR"
        ? "Draft an Architecture Decision Record the student can copy. State context, decision, and consequences."
        : "Draft an architecture note the student can copy, with module paths.";
  return [
    target,
    "Do not claim you will push to GitHub. This is a local draft only.",
    wrapUntrusted("REPO_FACTS", facts),
  ].join("\n\n");
}
