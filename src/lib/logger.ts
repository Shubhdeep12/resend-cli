import pino from "pino";

const level = process.env.LOG_LEVEL ?? (process.env.DEBUG ? "debug" : "info");

const usePretty =
  typeof process.stdout?.isTTY === "boolean" &&
  process.stdout.isTTY &&
  process.env.LOG_FORMAT !== "json";

/**
 * Application logger. Writes to stderr so stdout stays clean for --json and tables.
 * - LOG_LEVEL: trace | debug | info | warn | error | fatal (default: info)
 * - DEBUG=1: same as LOG_LEVEL=debug
 * - LOG_FORMAT=json: force JSON lines (e.g. for scripts); otherwise pretty in TTY
 */
export const logger = usePretty
  ? pino({
      level,
      transport: {
        target: "pino-pretty",
        options: {
          destination: 2,
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
        },
      },
    })
  : pino({ level }, pino.destination(2));

export type Logger = pino.Logger;

/** Command result output (stdout). Use for --json, tables, and detail blocks so all output goes through one place. */
export function stdout(message: string): void {
  process.stdout.write(message + (message.endsWith("\n") ? "" : "\n"));
}
