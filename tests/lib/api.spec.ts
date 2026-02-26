import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const configStore = vi.hoisted(() => ({
  apiKey: undefined as string | undefined,
}));

vi.mock("#/lib/config.js", () => ({
  config: {
    get apiKey(): string | undefined {
      return configStore.apiKey;
    },
  },
}));
vi.mock("#/lib/logger.js", () => ({
  logger: { error: vi.fn(), debug: vi.fn() },
}));

describe("ResendClient", () => {
  beforeEach(() => {
    vi.resetModules();
    configStore.apiKey = undefined;
  });

  afterEach(() => vi.clearAllMocks());

  it("getInstance throws when API key is not set", async () => {
    const { ResendClient } = await import("#/lib/api.js");
    expect(() => ResendClient.getInstance()).toThrow(
      "API key not found. Please run `resend auth login` or set RESEND_API_KEY environment variable.",
    );
  });

  it("getInstance returns Resend instance when API key is set", async () => {
    configStore.apiKey = "re_test_key";
    const { ResendClient } = await import("#/lib/api.js");
    const client = ResendClient.getInstance();
    expect(client).toBeDefined();
    expect(client).toHaveProperty("emails");
    expect(client).toHaveProperty("domains");
    expect(client).toHaveProperty("apiKeys");
  });

  it("getInstance returns same instance on multiple calls", async () => {
    configStore.apiKey = "re_test_key";
    const { ResendClient } = await import("#/lib/api.js");
    expect(ResendClient.getInstance()).toBe(ResendClient.getInstance());
  });
});
