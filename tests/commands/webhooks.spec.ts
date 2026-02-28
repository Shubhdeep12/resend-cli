import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import {
  disableFetchMocks,
  enableFetchMocks,
  resetConfigMock,
} from "../test-utils/cli-mocks.js";
import { runAppWithOutput } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";
import { webhooks as webhookSnapshots } from "../test-utils/snapshots.js";

describe("webhooks", () => {
  beforeEach(() => {
    enableFetchMocks();
    resetConfigMock();
  });
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("list: calls API and returns JSON", async () => {
    mockSuccessResponse(webhookSnapshots.list);
    const { output } = await runAppWithOutput(app, [
      "webhooks",
      "list",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/webhooks");
    expect(output).toEqual(webhookSnapshots.list);
  });

  it("get: calls API with id", async () => {
    mockSuccessResponse(webhookSnapshots.get);
    const { output } = await runAppWithOutput(app, [
      "webhooks",
      "get",
      "wh_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/webhooks/wh_123");
    expect(output).toEqual(webhookSnapshots.get);
  });

  it("create: calls API with url and events", async () => {
    mockSuccessResponse(webhookSnapshots.create);
    const { output } = await runAppWithOutput(app, [
      "webhooks",
      "create",
      "--url",
      "https://example.com/hook",
      "--events",
      "email.sent",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body).toMatchObject({
      endpoint: "https://example.com/hook",
      events: ["email.sent"],
    });
    expect(output).toMatchObject({ id: "wh_new" });
  });

  it("update: calls API with id and events", async () => {
    mockSuccessResponse(webhookSnapshots.update);
    const { output } = await runAppWithOutput(app, [
      "webhooks",
      "update",
      "wh_123",
      "--events",
      "email.sent",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body.events).toEqual(["email.sent"]);
    expect(output).toMatchObject({ id: "wh_1" });
  });

  it("delete: calls remove API with id", async () => {
    mockSuccessResponse(webhookSnapshots.remove);
    const { output } = await runAppWithOutput(app, [
      "webhooks",
      "delete",
      "wh_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/webhooks/wh_123");
    expect(output).toMatchObject({ id: "wh_123" });
  });
});
