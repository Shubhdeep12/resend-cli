#!/usr/bin/env node
import { run } from "@stricli/core";
import pkg from "../package.json" with { type: "json" };
import { app } from "./app.js";
import { ENV } from "./lib/constants/index.js";
import { logger } from "./lib/logger.js";
import { printWelcome } from "./lib/logo.js";
import { maybeCheckForUpdates } from "./lib/version-check.js";

const args = process.argv.slice(2);

if (args.length === 0) {
  printWelcome((pkg as { version: string }).version);
  process.exit(0);
}

const { name, version } = pkg as { name: string; version: string };

const hasJsonFlag = args.includes("--json");
const hasNoCheckFlag = args.includes("--no-check-version");
const envDisabled =
  process.env[ENV.RESEND_CLI_NO_VERSION_CHECK] != null &&
  process.env[ENV.RESEND_CLI_NO_VERSION_CHECK] !== "0" &&
  process.env[ENV.RESEND_CLI_NO_VERSION_CHECK]?.toLowerCase() !== "false";

if (hasNoCheckFlag) {
  const index = args.indexOf("--no-check-version");
  if (index !== -1) args.splice(index, 1);
}

if (!hasNoCheckFlag && !envDisabled) {
  void maybeCheckForUpdates({
    currentVersion: version,
    packageName: name,
    jsonMode: hasJsonFlag,
  });
}

run(app, args, { process }).catch((err) => {
  logger.error(
    { err: err instanceof Error ? err.message : String(err) },
    "Unhandled error",
  );
  process.exitCode = process.exitCode ?? 1;
});
