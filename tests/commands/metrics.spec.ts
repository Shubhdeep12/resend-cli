import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import {
  disableFetchMocks,
  enableFetchMocks,
  resetConfigMock,
} from "../test-utils/cli-mocks.js";
import { runAppWithOutput, runAppWithStdout } from "../test-utils/helpers.js";
import {
  mockErrorResponse,
  mockSuccessResponse,
} from "../test-utils/mock-fetch.js";
import {
  broadcasts,
  contacts,
  emails as emailSnapshots,
  listEmpty,
} from "../test-utils/snapshots.js";

describe("Metrics", () => {
  beforeEach(() => {
    enableFetchMocks();
    resetConfigMock();
  });
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  describe("emails", () => {
    it("aggregates by day and returns JSON with --json", async () => {
      mockSuccessResponse(emailSnapshots.list);
      const { output } = await runAppWithOutput(app, [
        "metrics",
        "emails",
        "--days",
        "15",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://api.resend.com/emails?limit=100",
      );
      const json = output as {
        window: { days: number };
        totals: { sent: number; delivered: number };
        by_day: { date: string; sent: number; delivered: number }[];
      };
      expect(json.window.days).toBe(15);
      expect(json.totals.sent).toBeGreaterThanOrEqual(0);
      expect(json.totals.delivered).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(json.by_day)).toBe(true);
      expect(json.by_day.length).toBe(15);
    });

    it("prints a human-readable summary without --json", async () => {
      mockSuccessResponse(emailSnapshots.list);
      const { stdout } = await runAppWithStdout(app, [
        "metrics",
        "emails",
        "--days",
        "5",
      ]);
      expect(stdout).toContain("Email metrics (last 5 days)");
      // Depending on whether there is activity in the chosen window,
      // we either see the graph or the "no activity" hint. Assert on stable text.
      expect(
        stdout.includes("No email activity in this window.") ||
          stdout.includes("Sent"),
      ).toBe(true);
    });

    it("handles empty data with --json", async () => {
      mockSuccessResponse(listEmpty);
      const { output } = await runAppWithOutput(app, [
        "metrics",
        "emails",
        "--days",
        "7",
        "--json",
      ]);
      const json = output as {
        window: { days: number };
        totals: { sent: number };
      };
      expect(json.window.days).toBe(7);
      expect(json.totals.sent).toBe(0);
    });

    it("on API error prints error message (no --json)", async () => {
      mockErrorResponse({
        name: "invalid_api_key",
        message: "Invalid API key",
        statusCode: 401,
      });
      const { stdout } = await runAppWithStdout(app, [
        "metrics",
        "emails",
        "--days",
        "5",
      ]);
      expect(stdout).toContain("Invalid API key");
    });
  });

  describe("audience", () => {
    it("returns JSON with --json", async () => {
      mockSuccessResponse(contacts.list);
      const { output } = await runAppWithOutput(app, [
        "metrics",
        "audience",
        "--days",
        "7",
        "--json",
      ]);
      const json = output as {
        window: { days: number };
        totals: { subscribed: number };
        by_day: { date: string; subscribed: number }[];
      };
      expect(json.window.days).toBe(7);
      expect(json).toHaveProperty("totals");
      expect(json.totals).toHaveProperty("subscribed");
      expect(Array.isArray(json.by_day)).toBe(true);
    });
  });

  describe("broadcasts", () => {
    it("returns JSON with --json", async () => {
      mockSuccessResponse(broadcasts.list);
      const { output } = await runAppWithOutput(app, [
        "metrics",
        "broadcasts",
        "--days",
        "7",
        "--json",
      ]);
      const json = output as {
        window: { days: number };
        totals: { sent: number };
        by_day: { date: string; sent: number }[];
      };
      expect(json.window.days).toBe(7);
      expect(json.totals).toHaveProperty("sent");
      expect(Array.isArray(json.by_day)).toBe(true);
    });
  });

  describe("dashboard", () => {
    it("returns combined JSON with --json", async () => {
      fetchMock
        .mockResponseOnce(JSON.stringify(emailSnapshots.list))
        .mockResponseOnce(JSON.stringify(contacts.list))
        .mockResponseOnce(JSON.stringify(broadcasts.list));
      const { output } = await runAppWithOutput(app, [
        "metrics",
        "dashboard",
        "--days",
        "5",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      const json = output as {
        window: { days: number };
        emails: { totals: unknown; by_day: unknown[] };
        audience: { totals: unknown; by_day: unknown[] };
        broadcasts: { totals: unknown; by_day: unknown[] };
      };
      expect(json.window.days).toBe(5);
      expect(json.emails).toBeDefined();
      expect(json.audience).toBeDefined();
      expect(json.broadcasts).toBeDefined();
    });
  });
});
