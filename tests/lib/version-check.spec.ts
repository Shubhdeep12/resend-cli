import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("conf", () => {
  class MockConf<T> {
    private store = new Map<keyof T, T[keyof T]>();

    constructor(options?: { defaults?: T }) {
      if (options?.defaults) {
        for (const [key, value] of Object.entries(options.defaults)) {
          this.store.set(key as keyof T, value as T[keyof T]);
        }
      }
    }

    get<K extends keyof T>(key: K): T[K] | undefined {
      return this.store.get(key) as T[K] | undefined;
    }

    set<K extends keyof T>(key: K, value: NonNullable<T[K]>): void {
      this.store.set(key, value as T[keyof T]);
    }

    delete<K extends keyof T>(key: K): void {
      this.store.delete(key);
    }

    clear(): void {
      this.store.clear();
    }
  }

  return { default: MockConf };
});

describe("maybeCheckForUpdates", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing when package is up to date", async () => {
    const { maybeCheckForUpdates } = await import("#/lib/version-check.js");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    fetchMock.mockResponseOnce(
      JSON.stringify({
        "dist-tags": { latest: "0.4.2" },
      }),
    );

    const writeSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await maybeCheckForUpdates({
      currentVersion: "0.4.2",
      packageName: "@shubhdeep12/resend-cli",
      force: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const output = writeSpy.mock.calls
      .map((args) => args[0])
      .join("")
      .trim();
    expect(output).toBe("");

    writeSpy.mockRestore();
  });

  it("prints a notice when a newer version is available", async () => {
    const { maybeCheckForUpdates } = await import("#/lib/version-check.js");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    fetchMock.mockResponseOnce(
      JSON.stringify({
        "dist-tags": { latest: "0.4.3" },
      }),
    );

    const writeSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await maybeCheckForUpdates({
      currentVersion: "0.4.2",
      packageName: "@shubhdeep12/resend-cli",
      force: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const output = writeSpy.mock.calls.map((args) => args[0]).join("");
    expect(output).toContain(
      "A new version of resend-cli is available: 0.4.3 (current 0.4.2).",
    );

    writeSpy.mockRestore();
  });

  it("throttles checks to at most once per 24 hours", async () => {
    const { maybeCheckForUpdates } = await import("#/lib/version-check.js");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    fetchMock.mockResponse(
      JSON.stringify({
        "dist-tags": { latest: "0.4.3" },
      }),
    );

    await maybeCheckForUpdates({
      currentVersion: "0.4.2",
      packageName: "@shubhdeep12/resend-cli",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockClear();
    vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));

    await maybeCheckForUpdates({
      currentVersion: "0.4.2",
      packageName: "@shubhdeep12/resend-cli",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("logs via logger instead of stdout in jsonMode", async () => {
    const { maybeCheckForUpdates } = await import("#/lib/version-check.js");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    fetchMock.mockResponseOnce(
      JSON.stringify({
        "dist-tags": { latest: "0.4.3" },
      }),
    );

    const writeSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await maybeCheckForUpdates({
      currentVersion: "0.4.2",
      packageName: "@shubhdeep12/resend-cli",
      jsonMode: true,
      force: true,
    });

    const output = writeSpy.mock.calls
      .map((args) => args[0])
      .join("")
      .trim();
    expect(output).toBe("");

    writeSpy.mockRestore();
  });
});
