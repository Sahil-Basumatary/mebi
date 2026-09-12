export type ReviewFinding = {
  severity: "high" | "medium" | "low";
  title: string;
  path: string | null;
  note: string;
};

const SEVERITIES = new Set(["high", "medium", "low"]);

export function parseReviewFindings(text: string): ReviewFinding[] {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? text.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const rows = Array.isArray(parsed) ? parsed : [];
  const findings: ReviewFinding[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const severity = typeof item.severity === "string" ? item.severity.toLowerCase() : "";
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!SEVERITIES.has(severity) || !title) continue;
    findings.push({
      severity: severity as ReviewFinding["severity"],
      title: title.slice(0, 160),
      path: typeof item.path === "string" && item.path.trim() ? item.path.trim().slice(0, 240) : null,
      note: typeof item.note === "string" ? item.note.trim().slice(0, 600) : "",
    });
    if (findings.length >= 20) break;
  }
  return findings;
}

export function categoriesFromFindings(findings: ReviewFinding[]): string[] {
  const categories = new Set<string>();
  for (const finding of findings) {
    if (finding.severity === "high") categories.add("correctness");
    const blob = `${finding.title} ${finding.note}`.toLowerCase();
    if (/(security|injection|secret|auth|xss|ssrf)/.test(blob)) categories.add("security");
    if (/(test|coverage|assert)/.test(blob)) categories.add("tests");
  }
  return [...categories];
}
