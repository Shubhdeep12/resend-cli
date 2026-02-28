import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "@stricli/core";
import type { Application, CommandContext } from "@stricli/core";
import { vi } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..", "..");

export const DUMMY_API_KEY = "re_test_dummy_key";

/** Temp config dir for runCli so the spawned CLI never writes to the user's real config. */
const TEST_CONFIG_DIR = path.join(projectRoot, "node_modules", ".cache", "resend-cli-test-config");

/** Run CLI in-process (fetch mocked in specs that import cli-mocks). */
export function runApp(
  app: Application<CommandContext>,
  argv: string[],
): Promise<void> {
  return run(app, argv, { process });
}

/** Run CLI and return the last JSON written to stdout (for --json commands). */
export async function runAppWithOutput(
  app: Application<CommandContext>,
  argv: string[],
): Promise<{ output: unknown }> {
  const writeSpy = vi
    .spyOn(process.stdout, "write")
    .mockImplementation(() => true);
  await run(app, argv, { process });
  const calls = writeSpy.mock.calls;
  writeSpy.mockRestore();
  const full = calls
    .map((args) => {
      const arg = args?.[0];
      return typeof arg === "string"
        ? arg
        : ((arg as Buffer | Uint8Array)?.toString?.() ?? "");
    })
    .join("");
  const trimmed = full.trimEnd();
  if (!trimmed) return { output: undefined };
  // In --json mode, stdout must be a single JSON document with no extra noise.
  return { output: JSON.parse(trimmed) as unknown };
}

/** Run CLI and return full stdout as string (for error-path or non-JSON output). */
export async function runAppWithStdout(
  app: Application<CommandContext>,
  argv: string[],
): Promise<{ stdout: string }> {
  const writeSpy = vi
    .spyOn(process.stdout, "write")
    .mockImplementation(() => true);
  await run(app, argv, { process });
  const calls = writeSpy.mock.calls;
  writeSpy.mockRestore();
  const stdout = calls
    .map((args) => {
      const arg = args?.[0];
      return typeof arg === "string"
        ? arg
        : ((arg as Buffer | Uint8Array)?.toString?.() ?? "");
    })
    .join("");
  return { stdout };
}

/** Run the built CLI binary (app.spec). Uses RESEND_CLI_CONFIG_DIR so the spawned process never touches the user's real config. */
export function runCli(args: string[]): {
  stdout: string;
  stderr: string;
  status: number | null;
} {
  mkdirSync(TEST_CONFIG_DIR, { recursive: true });
  const cliPath = path.join(projectRoot, "dist", "index.cjs");
  const result = spawnSync("node", [cliPath, ...args], {
    encoding: "utf8",
    cwd: projectRoot,
    env: {
      ...process.env,
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? DUMMY_API_KEY,
      RESEND_CLI_CONFIG_DIR: TEST_CONFIG_DIR,
    },
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status,
  };
}

/** Ensure dist exists; call in beforeAll for specs that use runCli. */
export function ensureBuild(): void {
  const build = spawnSync("pnpm", ["run", "build"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (build.status !== 0) {
    throw new Error(`CLI build failed: ${build.stderr ?? build.stdout}`);
  }
}
