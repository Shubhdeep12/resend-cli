/**
 * Version check and upgrade notice.
 * Throttles the check to once per 24h to avoid hitting the registry on every command.
 */
import pc from "picocolors";
import { config } from "./config/index.js";

const NPM_REGISTRY_URL =
  "https://registry.npmjs.org/@shubhdeep12/resend-cli/latest";
const THROTTLE_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Parse "x.y.z" or "x.y.z-pre" into [x, y, z]; missing parts are 0. */
function parseVersion(v: string): [number, number, number] {
  const match = /^(\d+)\.?(\d*)\.?(\d*)/.exec(v.trim());
  if (!match) return [0, 0, 0];
  return [
    Number.parseInt(match[1] ?? "0", 10),
    Number.parseInt(match[2] || "0", 10),
    Number.parseInt(match[3] || "0", 10),
  ];
}

/** True if latest > current (semver-ish comparison). */
export function isNewer(latest: string, current: string): boolean {
  const [la, lb, lc] = parseVersion(latest);
  const [ca, cb, cc] = parseVersion(current);
  if (la !== ca) return la > ca;
  if (lb !== cb) return lb > cb;
  return lc > cc;
}

/** Fetch latest version from npm registry. Returns null on error or timeout. */
export async function getLatestVersion(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(NPM_REGISTRY_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return typeof data?.version === "string" ? data.version : null;
  } catch {
    return null;
  }
}

/**
 * If a newer version exists, print a one-line notice to stderr.
 * Throttles so we only hit the registry at most once per THROTTLE_MS.
 * Skips when RESEND_CLI_CONFIG_DIR is set (e.g. tests).
 */
export async function notifyIfOutdated(currentVersion: string): Promise<void> {
  if (process.env.RESEND_CLI_CONFIG_DIR) {
    return;
  }
  const now = Date.now();
  const last = config.lastVersionCheckAt;
  if (last != null && now - last < THROTTLE_MS) {
    return;
  }
  config.lastVersionCheckAt = now;

  const latest = await getLatestVersion();
  if (!latest || !isNewer(latest, currentVersion)) return;

  const msg = pc.dim(
    `Resend CLI: update available (current: ${currentVersion}, latest: ${latest}). Run ${pc.cyan("resend upgrade check")} for details.`,
  );
  process.stderr.write(`${msg}\n`);
}
