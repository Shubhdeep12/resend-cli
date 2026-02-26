import { KeyringService } from "./config/keyring.js";
import { ConfigStore } from "./config/store.js";
import { ENV } from "./constants/index.js";
import type { SavedKey } from "./types/index.js";

export class Config {
  private readonly store: ConfigStore;
  private readonly keyring: KeyringService;

  constructor() {
    this.store = new ConfigStore();
    this.keyring = new KeyringService(this.store);
  }

  get apiKey(): string | undefined {
    const envKey = process.env[ENV.RESEND_API_KEY];
    if (envKey) return envKey;

    const selected = this.keyring.selectedKeyName;
    if (selected) {
      const selectedKey = this.keyring.getKey(selected);
      if (selectedKey) return selectedKey;
    }

    return this.store.get("apiKey");
  }

  set apiKey(value: string | undefined) {
    if (!value) {
      this.keyring.removeKey("default");
      this.store.delete("apiKey");
      return;
    }
    this.keyring.saveKey("default", value);
    this.keyring.selectKey("default");
    this.store.set("apiKey", value);
  }

  get defaultFrom(): string | undefined {
    return this.store.get("defaultFrom");
  }

  set defaultFrom(value: string | undefined) {
    if (value === undefined) {
      this.store.delete("defaultFrom");
      return;
    }
    this.store.set("defaultFrom", value);
  }

  clear() {
    this.store.clear();
  }

  get selectedKeyName(): string | undefined {
    return this.keyring.selectedKeyName;
  }

  saveKey(name: string, key: string): void {
    this.keyring.saveKey(name, key);
  }

  getKey(name: string): string | undefined {
    return this.keyring.getKey(name);
  }

  listKeys(): SavedKey[] {
    return this.keyring.listKeys();
  }

  selectKey(name: string): boolean {
    return this.keyring.selectKey(name);
  }

  removeKey(name: string): boolean {
    return this.keyring.removeKey(name);
  }

  clearSavedKeys(): void {
    this.keyring.clearSavedKeys();
  }
}

export const config = new Config();
