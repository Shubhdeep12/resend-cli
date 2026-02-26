#!/usr/bin/env node
import { run } from "@stricli/core";
import pkg from "../package.json" with { type: "json" };
import { app } from "./app.js";
import { logger } from "./lib/logger.js";
import { printWelcome } from "./lib/logo.js";

const args = process.argv.slice(2);

if (args.length === 0) {
  printWelcome((pkg as { version: string }).version);
  process.exit(0);
}

run(app, args, { process }).catch((err) => {
  logger.error(
    { err: err instanceof Error ? err.message : String(err) },
    "Unhandled error",
  );
  process.exitCode = process.exitCode ?? 1;
});
