/**
 * Error type and formatting for CLI. No stack traces are ever shown to users or agents.
 * Use CliError for all user-facing throws so stricli prints only the message.
 * Use formatAndWriteError() for top-level and uncaught handlers (plain or --json).
 */
export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Error";
    this.stack = this.message;
  }
}

/** Whether --json was passed in argv (for error output format). */
export function isJsonOutput(): boolean {
  return process.argv.includes("--json");
}

/** Get error message only (never stack). */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Write error to stderr: plain text or JSON when --json is in argv.
 * Never includes stack trace. Safe for humans and agents.
 */
export function formatAndWriteError(err: unknown): void {
  const message = getErrorMessage(err);
  if (isJsonOutput()) {
    process.stderr.write(
      `${JSON.stringify({ error: { message } }, null, 2)}\n`,
    );
  } else {
    process.stderr.write(message + (message.endsWith("\n") ? "" : "\n"));
  }
}
