import type { SavedKey } from "../types/index.js";
import type { ConfigStore } from "./store.js";

export class KeyringService {
  constructor(private readonly store: ConfigStore) {}

  get selectedKeyName(): string | undefined {
    return this.store.get("selectedKeyName");
  }

  saveKey(name: string, key: string): void {
    const keys = this.getKeysMap();
    keys[name] = key;
    this.store.set("keys", keys);
  }

  getKey(name: string): string | undefined {
    return this.getKeysMap()[name];
  }

  listKeys(): SavedKey[] {
    return Object.entries(this.getKeysMap())
      .map(([name, key]) => ({ name, key }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  selectKey(name: string): boolean {
    const key = this.getKey(name);
    if (!key) return false;
    this.store.set("selectedKeyName", name);
    return true;
  }

  removeKey(name: string): boolean {
    const keys = this.getKeysMap();
    if (!(name in keys)) return false;

    delete keys[name];
    this.store.set("keys", keys);

    if (this.selectedKeyName === name) {
      const next = Object.keys(keys).sort()[0];
      if (next) {
        this.store.set("selectedKeyName", next);
      } else {
        this.store.delete("selectedKeyName");
      }
    }

    return true;
  }

  clearSavedKeys(): void {
    this.store.set("keys", {});
    this.store.delete("selectedKeyName");
    this.store.delete("apiKey");
  }

  private getKeysMap(): Record<string, string> {
    return this.store.get("keys") ?? {};
  }
}
