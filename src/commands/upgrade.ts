import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import { packageName, version as currentVersion } from "../lib/package-identity.js";
import { stdout } from "../lib/logger.js";
import { formatError, formatSuccess } from "../lib/output.js";
import { createSpinner } from "../lib/ui.js";
import { getLatestVersion, isNewer } from "../lib/version-check.js";

const UPGRADE_CMD = `npm install -g ${packageName}@latest`;

export const upgradeRouteMap = buildRouteMap({
  routes: {
    check: buildCommand({
      parameters: {
        flags: {},
      },
      docs: {
        brief: "Check for a new version and show upgrade instructions",
      },
      func: async () => {
        const s = createSpinner({ enabled: true });
        s.start("Checking for updates...");
        const latest = await getLatestVersion();
        s.stop("");
        if (!latest) {
          stdout(
            formatError(
              "Could not reach the registry. Check your network or try again later.",
            ),
          );
          return;
        }
        if (isNewer(latest, currentVersion)) {
          stdout(
            formatSuccess(`A new version (${pc.bold(latest)}) is available.`),
          );
          stdout(pc.dim(`You are on ${currentVersion}.`));
          stdout("");
          stdout(pc.cyan("Upgrade with:"));
          stdout(`  ${UPGRADE_CMD}`);
          stdout("");
          stdout(pc.dim(`Or with pnpm: pnpm add -g ${packageName}@latest`));
        } else {
          stdout(formatSuccess("You're on the latest version."));
        }
      },
    }),
  },
  docs: { brief: "Check for updates and show upgrade instructions" },
});
