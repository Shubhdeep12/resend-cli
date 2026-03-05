/**
 * Single source of truth for package name and version.
 * All runtime and upgrade logic should use these instead of hardcoding.
 */
import pkg from "../../package.json" with { type: "json" };

type Pkg = { name: string; version: string; repository?: { url?: string } };

const p = pkg as Pkg;

export const packageName = p.name;
export const version = p.version;

/** npm registry URL for "latest" version (used by version-check). */
export const npmRegistryLatestUrl = `https://registry.npmjs.org/${p.name}/latest`;

/** GitHub repo slug (e.g. Shubhdeep12/resend-cli) from repository.url, or fallback. */
export function getGitHubRepoSlug(): string {
  const url = p.repository?.url ?? "";
  const match = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/i.exec(url);
  return match ? match[1] : "Shubhdeep12/resend-cli";
}
