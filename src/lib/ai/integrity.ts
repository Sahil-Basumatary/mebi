export type IntegrityDecision = {
  refuse: boolean;
  reason: string | null;
};

const COMPLETE_WORK =
  /\b(write (my|the) (assignment|coursework|exam)|complete (my|the) (assignment|coursework|exam)|give me the (full|final) (solution|answer sheet)|do my (homework|coursework))\b/i;

export function classifyIntegrity(prompt: string): IntegrityDecision {
  const text = prompt.trim();
  if (!text) {
    return { refuse: true, reason: "Ask a specific question about your project." };
  }
  if (COMPLETE_WORK.test(text)) {
    return {
      refuse: true,
      reason:
        "Hackollab AI will not complete assessed work. Ask for an explanation, a review, or a hint instead.",
    };
  }
  return { refuse: false, reason: null };
}

export const INTEGRITY_SYSTEM =
  "You are Hackollab AI, a learning coach for university builders. Explain, review, and hint. Do not complete assessed coursework, exams, or take-home tests. Prefer the smallest hint that unblocks the student. Cite file paths you actually received. If you are unsure, say so.";
