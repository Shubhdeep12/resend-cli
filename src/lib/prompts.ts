/**
 * Central prompts module. Re-exports @clack/prompts with safe wrappers so that
 * cancellation (Ctrl+C or any interrupt) is handled gracefully. Relies on the
 * global CLI exit handler (setupCliExitHandler in cli-exit.ts) for uncaught
 * throws from prompts; these wrappers add initialValue and try/catch for promise rejections.
 */
import * as clack from "@clack/prompts";

export { CANCEL_EXIT_CODE } from "./cli-exit.js";

/** Option shape for select/multiselect; @clack/prompts does not export Option. */
type SelectOption<Value extends string> = {
  value: Value;
  label?: string;
  hint?: string;
};

/** Wrapped text(): ensures initialValue so library never sees undefined (avoids trim crash). */
export async function text(opts: clack.TextOptions): Promise<string | symbol> {
  const safeOpts: clack.TextOptions = {
    ...opts,
    initialValue: opts.initialValue ?? "",
  };
  return clack.text(safeOpts);
}

/** Re-export select, confirm, multiselect with our SelectOption type; global exit handler covers throws. */
export async function select<
  Options extends SelectOption<Value>[],
  Value extends string,
>(
  opts: clack.SelectOptions<Options, Value>,
): Promise<symbol | Options[number]["value"]> {
  return clack.select(opts);
}

export async function confirm(
  opts: clack.ConfirmOptions,
): Promise<boolean | symbol> {
  return clack.confirm(opts);
}

export async function multiselect<
  Options extends SelectOption<Value>[],
  Value extends string,
>(
  opts: clack.SelectOptions<Options, Value>,
): Promise<symbol | Options[number]["value"][]> {
  return clack.multiselect(opts);
}

export {
  cancel,
  intro,
  isCancel,
  note,
  outro,
  spinner,
} from "@clack/prompts";

export type {
  ConfirmOptions,
  SelectOptions,
  TextOptions,
} from "@clack/prompts";
