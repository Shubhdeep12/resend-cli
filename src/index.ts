#!/usr/bin/env node
import "dotenv/config";
import { run } from "@stricli/core";
import { app } from "./app.js";
import { setupCliExitHandler } from "./lib/cli-exit.js";
import { formatAndWriteError } from "./lib/errors.js";
import { printWelcome } from "./lib/logo.js";
import { version } from "./lib/package-identity.js";
import { notifyIfOutdated } from "./lib/version-check.js";

setupCliExitHandler();

const args = process.argv.slice(2);

if (args.length === 0) {
  printWelcome(version);
  process.exit(0);
}

const isHelpOrVersion =
  args.includes("--help") ||
  args.includes("-h") ||
  args.includes("--version") ||
  args.includes("-V");
const isUpgradeCommand = args[0] === "upgrade";

run(app, args, { process })
  .then(async () => {
    if (!isHelpOrVersion && !isUpgradeCommand) {
      await notifyIfOutdated(version).catch(() => {});
    }
  })
  .catch((err) => {
    formatAndWriteError(err);
    process.exitCode = process.exitCode ?? 1;
  });
