import { ConfigStore } from "./config/store.js";
import { logger, stdout } from "./logger.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface VersionCheckOptions {
  currentVersion: string;
  packageName: string;
  /**
   * When true, avoid writing to stdout so JSON output from commands
   * stays valid. A notice is logged via the logger instead.
   */
  jsonMode?: boolean;
  /**
   * When true, ignore the throttle window. Intended for tests or
   * explicit calls; production should use the default (false).
   */
  force?: boolean;
}

const store = new ConfigStore();

function parseVersion(version: string): number[] {
  return version.split(".").map((part) => {
    const numeric = Number.parseInt(part, 10);
    return Number.isNaN(numeric) ? 0 : numeric;
  });
}

function isNewerVersion(current: string, latest: string): boolean {
  const currentParts = parseVersion(current);
  const latestParts = parseVersion(latest);
  const length = Math.max(currentParts.length, latestParts.length);

  for (let i = 0; i < length; i += 1) {
    const c = currentParts[i] ?? 0;
    const l = latestParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

export async function maybeCheckForUpdates(
  options: VersionCheckOptions,
): Promise<void> {
  const now = Date.now();

  try {
    if (!options.force) {
      const lastChecked = store.get("lastVersionCheckAt");
      if (typeof lastChecked === "number" && now - lastChecked < ONE_DAY_MS) {
        return;
      }
    }

    const encodedName = encodeURIComponent(options.packageName);
    const response = await fetch(
      `https://registry.npmjs.org/${encodedName}`,
    ).catch((error: unknown) => {
      logger.debug(
        { err: error instanceof Error ? error.message : String(error) },
        "Version check failed (network error)",
      );
      return undefined;
    });

    if (!response || !response.ok) {
      if (response) {
        logger.debug(
          { status: response.status },
          "Version check failed (non-2xx response)",
        );
      }
      return;
    }

    const body = (await response.json()) as {
      "dist-tags"?: { latest?: string };
    };
    const latest = body["dist-tags"]?.latest;
    if (!latest) {
      logger.debug("Version check response missing dist-tags.latest");
      return;
    }

    store.set("lastVersionCheckAt", now);

    if (!isNewerVersion(options.currentVersion, latest)) return;

    const displayName = options.packageName.replace(/^@[^/]+\//, "");
    const message = `A new version of ${displayName} is available: ${latest} (current ${options.currentVersion}). Update with: npm install -g ${options.packageName}`;

    if (options.jsonMode) {
      logger.info(
        {
          currentVersion: options.currentVersion,
          latestVersion: latest,
          packageName: options.packageName,
        },
        message,
      );
    } else {
      stdout(message);
    }
  } catch (error: unknown) {
    logger.debug(
      { err: error instanceof Error ? error.message : String(error) },
      "Version check failed (unexpected error)",
    );
  }
}
