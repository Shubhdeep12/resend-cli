/**
 * Runs before any test file.
 * - Enables fetch mock so the Resend SDK (loaded via app) uses it.
 * - Uses a temp config dir and dummy API key so (1) first run has a key, (2) no test writes to user config.
 */
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./test-utils/enable-fetch-mock.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const TEST_CONFIG_DIR = path.join(
  projectRoot,
  "node_modules",
  ".cache",
  "resend-cli-test-config",
);
const DUMMY_API_KEY = "re_test_dummy_key";

// All tests use this dir (in-process and runCli), so user config is never read/written.
process.env.RESEND_CLI_CONFIG_DIR = TEST_CONFIG_DIR;
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY ?? DUMMY_API_KEY;

// Start each run with an empty config dir so tests don't pass only because a previous run saved a key.
rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
mkdirSync(TEST_CONFIG_DIR, { recursive: true });
