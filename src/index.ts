#!/usr/bin/env node
import { run } from "@stricli/core";
import pkg from "../package.json" with { type: "json" };
import { app } from "./app.js";
import { setupCliExitHandler } from "./lib/cli-exit.js";
import { formatAndWriteError } from "./lib/errors.js";
import { printWelcome } from "./lib/logo.js";

setupCliExitHandler();

const args = process.argv.slice(2);

if (args.length === 0) {
  printWelcome((pkg as { version: string }).version);
  process.exit(0);
}

run(app, args, { process }).catch((err) => {
  formatAndWriteError(err);
  process.exitCode = process.exitCode ?? 1;
});
