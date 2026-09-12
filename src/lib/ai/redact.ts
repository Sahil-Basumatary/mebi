const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "aws", pattern: /AKIA[0-9A-Z]{16}/g },
  { name: "pem", pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA )?PRIVATE KEY-----/g },
  { name: "generic", pattern: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"]{8,}['"]/gi },
  { name: "bearer", pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g },
  { name: "ghp", pattern: /ghp_[A-Za-z0-9]{20,}/g },
  { name: "github_pat", pattern: /github_pat_[A-Za-z0-9_]{20,}/g },
];

export function redactSecrets(source: string): { text: string; redacted: number } {
  let text = source;
  let redacted = 0;
  for (const item of SECRET_PATTERNS) {
    text = text.replace(item.pattern, () => {
      redacted += 1;
      return `[redacted-${item.name}]`;
    });
  }
  return { text, redacted };
}
