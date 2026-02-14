import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sharedStore: Record<string, unknown> = { profile: "default" };

vi.mock("conf", () => ({
  default: class MockConf {
    get(key: string): unknown {
      return sharedStore[key];
    }
    set(key: string, value: unknown): void {
      sharedStore[key] = value;
    }
    clear(): void {
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
    sharedStore.apiKey = undefined;
    sharedStore.defaultFrom = undefined;
    sharedStore.profile = "default";
  });

  afterEach(() => {
    process.env[envKey] = originalEnv;
  });

  describe("apiKey", () => {
    it("returns value from store when set", async () => {
      const { config } = await import("#/lib/config.js");
      config.apiKey = "re_stored";
      expect(config.apiKey).toBe("re_stored");
    });

    it("returns RESEND_API_KEY from env when store is empty", async () => {
      process.env[envKey] = "re_from_env";
      const { config } = await import("#/lib/config.js");
      expect(config.apiKey).toBe("re_from_env");
    });

    it("prefers store over env when both set", async () => {
      process.env[envKey] = "re_env";
      const { config } = await import("#/lib/config.js");
      config.apiKey = "re_store";
      expect(config.apiKey).toBe("re_store");
    });

    it("returns undefined when neither store nor env set", async () => {
      delete process.env[envKey];
      const { config } = await import("#/lib/config.js");
      config.clear();
      expect(config.apiKey).toBeUndefined();
    });
  });

  describe("defaultFrom", () => {
    it("returns value when set", async () => {
      const { config } = await import("#/lib/config.js");
      config.defaultFrom = "sender@example.com";
      expect(config.defaultFrom).toBe("sender@example.com");
    });

    it("returns undefined when not set", async () => {
      const { config } = await import("#/lib/config.js");
      config.clear();
      expect(config.defaultFrom).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("clears stored values", async () => {
      const { config } = await import("#/lib/config.js");
      config.apiKey = "re_xxx";
      config.defaultFrom = "a@b.com";
      config.clear();
      delete process.env[envKey];
      expect(config.apiKey).toBeUndefined();
      expect(config.defaultFrom).toBeUndefined();
    });
  });
});
