/**
 * Smoke tests: one happy-path command per command group.
 * Uses mocked fetch and config; no real API calls.
 * Skipped in CI (GitHub Actions) where fetch mock ordering can differ; run locally: pnpm test tests/smoke.spec.ts
 */
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { disableFetchMocks, resetConfigMock } from "./test-utils/cli-mocks.js";
import { runApp, runAppWithOutput } from "./test-utils/helpers.js";
import { mockSuccessResponse } from "./test-utils/mock-fetch.js";
import {
  apiKeys,
  broadcasts,
  contactProperties,
  contacts,
  domains,
  emails,
  segments,
  templates,
  topics,
  webhooks,
} from "./test-utils/snapshots.js";

describe.skipIf(process.env.CI === "true")(
  "Smoke (one happy path per group)",
  () => {
    beforeEach(resetConfigMock);
    afterEach(() => fetchMock.resetMocks());
    afterAll(disableFetchMocks);

    it("auth whoami runs without API call", async () => {
      await runApp(app, ["auth", "whoami"]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("emails list --json", async () => {
      mockSuccessResponse(emails.list);
      const { output } = await runAppWithOutput(app, [
        "emails",
        "list",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalled();
      expect(output).toEqual(emails.list);
    });

    it("domains list --json", async () => {
      mockSuccessResponse(domains.list);
      const { output } = await runAppWithOutput(app, [
        "domains",
        "list",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalled();
      expect(output).toEqual(domains.list);
    });

    it("contacts list --json", async () => {
      mockSuccessResponse(contacts.list);
      const { output } = await runAppWithOutput(app, [
        "contacts",
        "list",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalled();
      expect(output).toEqual(contacts.list);
    });

    it("broadcasts list --json", async () => {
      mockSuccessResponse(broadcasts.list);
      const { output } = await runAppWithOutput(app, [
        "broadcasts",
        "list",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalled();
      expect(output).toEqual(broadcasts.list);
    });

    it("webhooks list --json", async () => {
      mockSuccessResponse(webhooks.list);
      const { output } = await runAppWithOutput(app, [
        "webhooks",
        "list",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalled();
      expect(output).toEqual(webhooks.list);
    });

    it("keys list --json", async () => {
      mockSuccessResponse(apiKeys.list);
      const { output } = await runAppWithOutput(app, [
        "keys",
        "list",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalled();
      expect(output).toEqual(apiKeys.list);
    });

    it("segments list --json", async () => {
      mockSuccessResponse(segments.list);
      const { output } = await runAppWithOutput(app, [
        "segments",
        "list",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalled();
      expect(output).toEqual(segments.list);
    });

    it("topics list --json", async () => {
      mockSuccessResponse(topics.list);
      const { output } = await runAppWithOutput(app, [
        "topics",
        "list",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalled();
      expect(output).toEqual(topics.list);
    });

    it("contact-properties list --json", async () => {
      mockSuccessResponse(contactProperties.list);
      const { output } = await runAppWithOutput(app, [
        "contact-properties",
        "list",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalled();
      expect(output).toMatchObject({
        object: "list",
        has_more: false,
        data: [{ id: "cp_1", key: "first_name", type: "string" }],
      });
    });

    it("templates list --json", async () => {
      mockSuccessResponse(templates.list);
      const { output } = await runAppWithOutput(app, [
        "templates",
        "list",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalled();
      expect(output).toEqual(templates.list);
    });
  },
);
