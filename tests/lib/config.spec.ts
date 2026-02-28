import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sharedStore: Record<string, unknown> = { profile: "default" };

vi.mock("conf", () => ({
  default: class MockConf {
    get(key: string): unknown {
      return sharedStore[key];
    }
    set(key: string, value: unknown): void {
      if (value === undefined) {
        throw new TypeError("Use `delete()` to clear values");
      }
      sharedStore[key] = value;
    }
    delete(key: string): void {
      delete sharedStore[key];
    }
    clear(): void {
      sharedStore.keys = undefined;
      sharedStore.selectedKeyName = undefined;
      sharedStore.apiKey = undefined;
      sharedStore.defaultFrom = undefined;
      sharedStore.profile = "default";
    }
  },
}));

describe("Config", () => {
  const envKey = "RESEND_API_KEY";
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env[envKey];
    sharedStore.keys = undefined;
    sharedStore.selectedKeyName = undefined;
    sharedStore.apiKey = undefined;
    sharedStore.defaultFrom = undefined;
    sharedStore.profile = "default";
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[envKey];
    } else {
      process.env[envKey] = originalEnv;
    }
  });

  describe("apiKey", () => {
    it("returns selected saved key when present", async () => {
      delete process.env[envKey];
      const { config } = await import("#/lib/config/index.js");
      config.saveKey("work", "re_work");
      config.selectKey("work");
      expect(config.apiKey).toBe("re_work");
    });

    it("returns RESEND_API_KEY from env when store is empty", async () => {
      process.env[envKey] = "re_from_env";
      const { config } = await import("#/lib/config/index.js");
      expect(config.apiKey).toBe("re_from_env");
    });

    it("prefers env over saved key when both are set", async () => {
      process.env[envKey] = "re_env";
      const { config } = await import("#/lib/config/index.js");
      config.saveKey("work", "re_store");
      config.selectKey("work");
      expect(config.apiKey).toBe("re_env");
    });

    it("returns undefined when neither store nor env set", async () => {
      delete process.env[envKey];
      const { config } = await import("#/lib/config/index.js");
      config.clear();
      expect(config.apiKey).toBeUndefined();
    });
  });

  describe("defaultFrom", () => {
    it("returns value when set", async () => {
      const { config } = await import("#/lib/config/index.js");
      config.defaultFrom = "sender@example.com";
      expect(config.defaultFrom).toBe("sender@example.com");
    });

    it("returns undefined when not set", async () => {
      const { config } = await import("#/lib/config/index.js");
      config.clear();
      expect(config.defaultFrom).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("clears stored values", async () => {
      const { config } = await import("#/lib/config/index.js");
      config.apiKey = "re_xxx";
      config.defaultFrom = "a@b.com";
      config.clear();
      delete process.env[envKey];
      expect(config.apiKey).toBeUndefined();
      expect(config.defaultFrom).toBeUndefined();
    });
  });

  describe("saved keys", () => {
    it("stores and lists named keys", async () => {
      const { config } = await import("#/lib/config/index.js");
      config.saveKey("work", "re_work");
      config.saveKey("personal", "re_personal");
      expect(config.listKeys()).toEqual([
        { name: "personal", key: "re_personal" },
        { name: "work", key: "re_work" },
      ]);
    });

    it("selects and removes keys", async () => {
      const { config } = await import("#/lib/config/index.js");
      config.saveKey("work", "re_work");
      config.selectKey("work");
      expect(config.selectedKeyName).toBe("work");
      expect(config.removeKey("work")).toBe(true);
      expect(config.selectedKeyName).toBeUndefined();
    });

    it("clearSavedKeys clears keys and selected key without set(undefined)", async () => {
      delete process.env[envKey];
      const { config } = await import("#/lib/config/index.js");
      config.saveKey("work", "re_work");
      config.selectKey("work");
      config.clearSavedKeys();
      expect(config.listKeys()).toEqual([]);
      expect(config.selectedKeyName).toBeUndefined();
      expect(config.apiKey).toBeUndefined();
    });
  });
});
