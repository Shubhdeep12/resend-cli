import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import {
  disableFetchMocks,
  enableFetchMocks,
  resetConfigMock,
} from "../test-utils/cli-mocks.js";
import { runAppWithOutput } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";
import { apiKeys as apiKeySnapshots } from "../test-utils/snapshots.js";

describe("keys (api-keys)", () => {
  beforeEach(() => {
    enableFetchMocks();
    resetConfigMock();
  });
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("list: calls API and returns JSON", async () => {
    mockSuccessResponse(apiKeySnapshots.list);
    const { output } = await runAppWithOutput(app, ["keys", "list", "--json"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api-keys");
    expect(output).toEqual(apiKeySnapshots.list);
  });

  it("delete: calls remove API with id", async () => {
    mockSuccessResponse(apiKeySnapshots.remove);
    const { output } = await runAppWithOutput(app, [
      "keys",
      "delete",
      "k_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api-keys/k_123");
    expect(output).toBeDefined();
  });
});
