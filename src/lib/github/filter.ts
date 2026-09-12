const SKIP_DIR = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "vendor",
  ".turbo",
  ".cache",
]);

const SKIP_FILE = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  ".env",
  ".env.local",
  ".env.production",
]);

const SKIP_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".woff",
  ".woff2",
  ".mp4",
  ".lock",
  ".bin",
]);

const MAX_INDEX_BYTES = 200_000;

export function shouldIndexPath(path: string, bytes: number): { index: boolean; role: string } {
  const normalised = path.replaceAll("\\", "/").replace(/^\.\//, "");
  const parts = normalised.split("/");
  if (parts.some((part) => SKIP_DIR.has(part))) {
    return { index: false, role: "skipped" };
  }
  const fileName = parts[parts.length - 1] ?? "";
  if (fileName.startsWith(".env")) {
    return { index: false, role: "secret" };
  }
  if (SKIP_FILE.has(fileName)) {
    return { index: false, role: "lockfile" };
  }
  const dot = fileName.lastIndexOf(".");
  const ext = dot >= 0 ? fileName.slice(dot).toLowerCase() : "";
  if (SKIP_EXT.has(ext)) {
    return { index: false, role: "binary" };
  }
  if (bytes > MAX_INDEX_BYTES) {
    return { index: false, role: "oversized" };
  }
  if (/\.(test|spec)\.[jt]sx?$/.test(fileName) || /\/__tests__\//.test(normalised)) {
    return { index: true, role: "test" };
  }
  if (fileName === "README.md" || fileName.endsWith(".md")) {
    return { index: true, role: "docs" };
  }
  if (
    fileName === "package.json" ||
    fileName === "tsconfig.json" ||
    fileName === "prisma.config.ts" ||
    fileName.endsWith(".prisma")
  ) {
    return { index: true, role: "config" };
  }
  return { index: true, role: "source" };
}

export function languageFromPath(path: string): string | null {
  const fileName = path.split("/").pop() ?? "";
  const ext = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase() : "";
  switch (ext) {
    case ".ts":
    case ".tsx":
      return "TypeScript";
    case ".js":
    case ".jsx":
      return "JavaScript";
    case ".py":
      return "Python";
    case ".go":
      return "Go";
    case ".rs":
      return "Rust";
    case ".java":
      return "Java";
    case ".sql":
      return "SQL";
    case ".md":
      return "Markdown";
    default:
      return null;
  }
}
