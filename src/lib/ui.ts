import * as p from "@clack/prompts";

type Spinner = {
  start: (message: string) => void;
  stop: (message?: string) => void;
};

const noopSpinner: Spinner = {
  start() {},
  stop() {},
};

/**
 * Create a spinner instance.
 *
 * When `enabled` is false, returns a no-op spinner that does nothing.
 * This is used to avoid writing any spinner output to stdout in JSON mode.
 */
export function createSpinner(options?: { enabled?: boolean }): Spinner {
  const enabled = options?.enabled ?? true;
  if (!enabled) return noopSpinner;
  return p.spinner();
}
