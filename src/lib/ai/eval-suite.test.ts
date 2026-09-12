import { describe, expect, it } from "vitest";
import { EVAL_TASKS, scoreEvalOutput, summariseEvalScores } from "@/lib/ai/eval-suite";
import { parseReviewFindings } from "@/lib/ai/findings";
import {
  isCircuitOpen,
  recordProviderFailure,
  recordProviderSuccess,
  resetCircuits,
} from "@/lib/ai/circuit";
import { isGlobalBudgetExhausted, shouldAlarmGlobalCost, shouldAlarmUsage } from "@/lib/ai/ops";
import { isDeletedRef, pathsFromPushPayload } from "@/lib/github/webhook";
import { capabilityForPlan, nextUtcMonthStart } from "@/lib/ai/quota";
import { fallbackRoute, routeModel } from "@/lib/ai/router";

describe("eval suite contracts", () => {
  it("covers the required task kinds", () => {
    const kinds = new Set(EVAL_TASKS.map((task) => task.kind));
    expect(kinds).toEqual(
      new Set(["architecture", "bug", "security", "hallucination", "hint", "docs", "structured"]),
    );
  });

  it("passes a complete architecture answer and fails a hallucinated file", () => {
    const task = EVAL_TASKS.find((item) => item.id === "arch-recall");
    if (!task) throw new Error("missing task");
    const pass = scoreEvalOutput(
      task,
      "Modules: src/app/api/checkout/route.ts, src/lib/wallet.ts, and PayButton.tsx.",
    );
    const fail = scoreEvalOutput(task, "Uses src/lib/legacy-ledger.ts only.");
    expect(pass.pass).toBe(true);
    expect(fail.pass).toBe(false);
    expect(summariseEvalScores([pass, fail])).toEqual({ passed: 1, total: 2 });
  });
});

describe("review findings", () => {
  it("reads a json fence", () => {
    const findings = parseReviewFindings(
      'Intro\n```json\n[{"severity":"high","title":"SQL injection","path":"src/db.ts","note":"string concat"}]\n```',
    );
    expect(findings).toEqual([
      {
        severity: "high",
        title: "SQL injection",
        path: "src/db.ts",
        note: "string concat",
      },
    ]);
  });
});

describe("circuit breaker", () => {
  it("opens after consecutive failures and closes on success", () => {
    resetCircuits();
    const now = 1_000_000;
    recordProviderFailure("openai", now);
    recordProviderFailure("openai", now);
    expect(isCircuitOpen("openai", now)).toBe(false);
    recordProviderFailure("openai", now);
    expect(isCircuitOpen("openai", now)).toBe(true);
    recordProviderSuccess("openai");
    expect(isCircuitOpen("openai", now)).toBe(false);
  });
});

describe("budget alarms", () => {
  it("warns at or below 20% remaining", () => {
    expect(shouldAlarmUsage(10, 50)).toBe(true);
    expect(shouldAlarmUsage(11, 50)).toBe(false);
    expect(shouldAlarmGlobalCost(32_000_000, 40_000_000)).toBe(true);
    expect(isGlobalBudgetExhausted(40_000_000, 40_000_000)).toBe(true);
  });
});

describe("push path filtering", () => {
  it("splits changed and removed paths", () => {
    const paths = pathsFromPushPayload({
      commits: [
        { added: ["src/a.ts"], modified: ["src/b.ts"], removed: ["src/old.ts"] },
        { modified: ["src/a.ts"], removed: ["src/b.ts"] },
      ],
    });
    expect(paths.removed).toEqual(["src/old.ts", "src/b.ts"]);
    expect(paths.changed.sort()).toEqual(["src/a.ts"]);
    expect(isDeletedRef("0000000000000000000000000000000000000000")).toBe(true);
  });
});

describe("routing fallbacks", () => {
  it("keeps Advanced on Pro and falls back to a different provider", () => {
    expect(capabilityForPlan("PRO", "ADVANCED")).toBe("ADVANCED");
    const primary = routeModel({ capability: "ADVANCED", plan: "PRO" });
    const fallback = fallbackRoute("ADVANCED");
    expect(fallback.provider).not.toBe(primary.provider);
    expect(nextUtcMonthStart(new Date("2026-08-25T12:00:00.000Z")).toISOString()).toBe(
      "2026-09-01T00:00:00.000Z",
    );
  });
});
