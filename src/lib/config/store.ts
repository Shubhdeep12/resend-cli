import Conf from "conf";
import type { ConfigSchema } from "../types/index.js";

/** When set (e.g. by test runner for runCli), config is stored here instead of user dir. */
const CONFIG_DIR_ENV = "RESEND_CLI_CONFIG_DIR";

export class ConfigStore {
  private readonly conf: Conf<ConfigSchema>;

  constructor() {
    const cwd = process.env[CONFIG_DIR_ENV];
    this.conf = new Conf<ConfigSchema>({
      projectName: "resend-cli",
      ...(cwd && { cwd }),
      defaults: {
        profile: "default",
      },
    });
  }

  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
    return this.conf.get(key);
  }

  set<K extends keyof ConfigSchema>(
    key: K,
    value: NonNullable<ConfigSchema[K]>,
  ): void {
    this.conf.set(key, value);
  }

  delete<K extends keyof ConfigSchema>(key: K): void {
    this.conf.delete(key);
  }

  clear(): void {
    this.conf.clear();
  }
}
