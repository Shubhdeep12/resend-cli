#!/usr/bin/env node
import { run } from "@stricli/core";
import pkg from "../package.json" with { type: "json" };
import { app } from "./app.js";
import { setupCliExitHandler } from "./lib/cli-exit.js";
import { formatAndWriteError } from "./lib/errors.js";
import { printWelcome } from "./lib/logo.js";
import { notifyIfOutdated } from "./lib/version-check.js";

setupCliExitHandler();

const args = process.argv.slice(2);
const version = (pkg as { version: string }).version;

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
