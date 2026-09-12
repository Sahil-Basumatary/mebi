import "server-only";

import { SignJWT, importPKCS8 } from "jose";

const API = "https://api.github.com";

function appPrivateKey(): string {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY?.trim();
  if (!raw) {
    throw new Error("GITHUB_APP_PRIVATE_KEY is missing.");
  }
  return raw.includes("\\n") ? raw.replaceAll("\\n", "\n") : raw;
}

function appId(): string {
  const id = process.env.GITHUB_APP_ID?.trim();
  if (!id) {
    throw new Error("GITHUB_APP_ID is missing.");
  }
  return id;
}

export function githubAppSlug(): string | null {
  return process.env.GITHUB_APP_SLUG?.trim() || process.env.NEXT_PUBLIC_GITHUB_APP_SLUG?.trim() || null;
}

export async function githubAppJwt(): Promise<string> {
  const key = await importPKCS8(appPrivateKey(), "RS256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 9 * 60)
    .setIssuer(appId())
    .sign(key);
}

async function githubFetch(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub ${response.status}: ${body.slice(0, 300)}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function createInstallationToken(installationId: string): Promise<string> {
  const jwt = await githubAppJwt();
  const payload = await githubFetch(`/app/installations/${installationId}/access_tokens`, jwt, {
    method: "POST",
  });
  if (!payload?.token || typeof payload.token !== "string") {
    throw new Error("GitHub installation token missing.");
  }
  return payload.token;
}

export type GithubRepoRecord = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  owner: { login: string; id: number };
};

export async function getInstallation(installationId: string) {
  const jwt = await githubAppJwt();
  return githubFetch(`/app/installations/${installationId}`, jwt) as Promise<{
    id: number;
    account: { login: string; id: number };
  }>;
}

export async function listInstallationRepos(installationId: string): Promise<GithubRepoRecord[]> {
  const token = await createInstallationToken(installationId);
  const repos: GithubRepoRecord[] = [];
  let page = 1;
  while (page <= 10) {
    const payload = await githubFetch(
      `/installation/repositories?per_page=100&page=${page}`,
      token,
    );
    const batch = Array.isArray(payload?.repositories) ? payload.repositories : [];
    repos.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return repos;
}

export async function getRepoTree(installationId: string, owner: string, repo: string, ref: string) {
  const token = await createInstallationToken(installationId);
  return githubFetch(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
    token,
  ) as Promise<{
    sha: string;
    truncated: boolean;
    tree: Array<{ path?: string; type?: string; sha?: string; size?: number }>;
  }>;
}

export async function getFileContent(
  installationId: string,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<{ text: string; sha: string; size: number } | null> {
  const token = await createInstallationToken(installationId);
  const payload = await githubFetch(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`,
    token,
  );
  if (!payload || payload.encoding !== "base64" || typeof payload.content !== "string") {
    return null;
  }
  const text = Buffer.from(payload.content.replaceAll("\n", ""), "base64").toString("utf8");
  return { text, sha: payload.sha, size: payload.size ?? text.length };
}

export async function compareCommits(
  installationId: string,
  owner: string,
  repo: string,
  base: string,
  head: string,
) {
  const token = await createInstallationToken(installationId);
  return githubFetch(
    `/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
    token,
  ) as Promise<{
    files?: Array<{ filename: string; status: string; patch?: string; sha?: string }>;
    commits?: Array<{ sha: string; commit: { message: string } }>;
  }>;
}

export async function getCommit(installationId: string, owner: string, repo: string, sha: string) {
  const token = await createInstallationToken(installationId);
  return githubFetch(`/repos/${owner}/${repo}/commits/${encodeURIComponent(sha)}`, token) as Promise<{
    sha: string;
    commit: { message: string };
    files?: Array<{ filename: string; status: string; patch?: string; additions?: number; deletions?: number }>;
  }>;
}

export async function listRecentCommits(
  installationId: string,
  owner: string,
  repo: string,
  ref: string,
): Promise<Array<{ sha: string; message: string }>> {
  const token = await createInstallationToken(installationId);
  const payload = await githubFetch(
    `/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(ref)}&per_page=12`,
    token,
  );
  if (!Array.isArray(payload)) return [];
  return payload
    .map((row: { sha?: string; commit?: { message?: string } }) => ({
      sha: typeof row.sha === "string" ? row.sha : "",
      message: typeof row.commit?.message === "string" ? row.commit.message.split("\n")[0] ?? "" : "",
    }))
    .filter((row: { sha: string }) => row.sha);
}

export async function deleteRemoteInstallation(installationId: string): Promise<void> {
  const jwt = await githubAppJwt();
  await githubFetch(`/app/installations/${installationId}`, jwt, { method: "DELETE" });
}
