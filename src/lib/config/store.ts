import Conf from "conf";
import type { ConfigSchema } from "../types/index.js";

export class ConfigStore {
  private readonly conf: Conf<ConfigSchema>;

  constructor() {
    this.conf = new Conf<ConfigSchema>({
      projectName: "resend-cli",
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
