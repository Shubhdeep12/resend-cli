import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "@stricli/core";
import type { Application, CommandContext } from "@stricli/core";
import { vi } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..", "..");

export const DUMMY_API_KEY = "re_test_dummy_key";

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
  for (let i = calls.length - 1; i >= 0; i--) {
    const arg = calls[i]?.[0];
    const str =
      typeof arg === "string"
        ? arg
        : (arg as Buffer | Uint8Array)?.toString?.();
    if (typeof str === "string") {
      const trimmed = str.trimEnd();
      try {
        return { output: JSON.parse(trimmed) as unknown };
      } catch {
        // not JSON
      }
    }
  }
  return { output: undefined };
}

/** Run the built CLI binary (used by app.spec for --help, --version). */
export function runCli(args: string[]): {
  stdout: string;
  stderr: string;
  status: number | null;
} {
  const cliPath = path.join(projectRoot, "dist", "index.cjs");
  const result = spawnSync("node", [cliPath, ...args], {
    encoding: "utf8",
    cwd: projectRoot,
    env: {
      ...process.env,
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? DUMMY_API_KEY,
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
