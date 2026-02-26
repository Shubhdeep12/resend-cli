import Conf from "conf";

interface ConfigSchema {
  keys?: Record<string, string>;
  selectedKeyName?: string;
  apiKey?: string;
  defaultFrom?: string;
  profile?: string;
}

export class Config {
  private conf: Conf<ConfigSchema>;

  constructor() {
    this.conf = new Conf<ConfigSchema>({
      projectName: "resend-cli",
      defaults: {
        profile: "default",
      },
    });
  }

  get apiKey(): string | undefined {
    const envKey = process.env.RESEND_API_KEY;
    if (envKey) return envKey;

    const selected = this.selectedKeyName;
    if (selected) {
      const selectedKey = this.getKey(selected);
      if (selectedKey) return selectedKey;
    }

    return this.conf.get("apiKey");
  }

  set apiKey(value: string | undefined) {
    if (!value) {
      this.removeKey("default");
      this.conf.delete("apiKey");
      return;
    }
    this.saveKey("default", value);
    this.selectKey("default");
    this.conf.set("apiKey", value);
  }

  get defaultFrom(): string | undefined {
    return this.conf.get("defaultFrom");
  }

  set defaultFrom(value: string | undefined) {
    if (value === undefined) {
      this.conf.delete("defaultFrom");
      return;
    }
    this.conf.set("defaultFrom", value);
  }

  clear() {
    this.conf.clear();
  }

  get selectedKeyName(): string | undefined {
    return this.conf.get("selectedKeyName");
  }

  saveKey(name: string, key: string): void {
    const keys = this.getKeysMap();
    keys[name] = key;
    this.conf.set("keys", keys);
  }

  getKey(name: string): string | undefined {
    return this.getKeysMap()[name];
  }

  listKeys(): Array<{ name: string; key: string }> {
    return Object.entries(this.getKeysMap())
      .map(([name, key]) => ({ name, key }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  selectKey(name: string): boolean {
    const key = this.getKey(name);
    if (!key) return false;
    this.conf.set("selectedKeyName", name);
    return true;
  }

  removeKey(name: string): boolean {
    const keys = this.getKeysMap();
    if (!(name in keys)) return false;
    delete keys[name];
    this.conf.set("keys", keys);

    if (this.selectedKeyName === name) {
      const next = Object.keys(keys).sort()[0];
      if (next) {
        this.conf.set("selectedKeyName", next);
      } else {
        this.conf.delete("selectedKeyName");
      }
    }
    return true;
  }

  clearSavedKeys(): void {
    this.conf.set("keys", {});
    this.conf.delete("selectedKeyName");
    this.conf.delete("apiKey");
  }

  private getKeysMap(): Record<string, string> {
    return this.conf.get("keys") ?? {};
  }
}

export const config = new Config();
