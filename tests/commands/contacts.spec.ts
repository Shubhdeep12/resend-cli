import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import {
  disableFetchMocks,
  enableFetchMocks,
  resetConfigMock,
} from "../test-utils/cli-mocks.js";
import { runApp, runAppWithOutput } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";
import { contacts as contactSnapshots } from "../test-utils/snapshots.js";

describe("contacts", () => {
  beforeEach(() => {
    enableFetchMocks();
    resetConfigMock();
  });
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("list: calls API with segment-id and returns JSON", async () => {
    mockSuccessResponse(contactSnapshots.list);
    const { output } = await runAppWithOutput(app, [
      "contacts",
      "list",
      "--segment-id",
      "seg_abc",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toMatch(/\/segments\/seg_abc\/contacts|\/contacts.*segment/);
    expect(output).toEqual(contactSnapshots.list);
  });

  it("create: calls API with segments and email", async () => {
    mockSuccessResponse(contactSnapshots.create);
    await runApp(app, [
      "contacts",
      "create",
      "--segments",
      '[{"id":"seg_abc"}]',
      "--email",
      "user@example.com",
      "--firstName",
      "Jane",
      "--lastName",
      "Doe",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("contacts");
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body).toMatchObject({
      email: "user@example.com",
      segments: [{ id: "seg_abc" }],
    });
  });
});
