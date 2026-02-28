/**
 * Single global handler for CLI exits: Ctrl+C (SIGINT), prompt cancellation throws
 * (e.g. @clack/prompts trim on undefined), and other uncaught errors.
 * Register once at CLI entry. Never prints stack traces; uses formatAndWriteError.
 */
import * as clack from "@clack/prompts";
import { formatAndWriteError } from "./errors.js";

const CANCEL_MESSAGE = "Cancelled.";

/** Exit code for user-initiated cancel (e.g. Ctrl+C). 130 = 128 + SIGINT. */
export const CANCEL_EXIT_CODE = 130;

function isCancelLike(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes("trim") ||
      msg.includes("cancel") ||
      msg.includes("sigint")
    )
      return true;
  }
  return false;
}

function doCancel(): void {
  clack.cancel(CANCEL_MESSAGE);
  process.exit(CANCEL_EXIT_CODE);
}

/** Call once at CLI startup (e.g. in index.ts). Handles SIGINT and uncaughtException. */
export function setupCliExitHandler(): void {
  process.on("SIGINT", () => doCancel());

  process.on("uncaughtException", (err: unknown) => {
    if (isCancelLike(err)) doCancel();
    formatAndWriteError(err);
    process.exit(1);
  });
}
