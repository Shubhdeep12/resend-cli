import { afterAll, afterEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { disableFetchMocks } from "../test-utils/cli-mocks.js";
import { runAppWithOutput } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";
import { broadcasts as broadcastSnapshots } from "../test-utils/snapshots.js";

describe("broadcasts", () => {
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("list: calls API and returns JSON", async () => {
    mockSuccessResponse(broadcastSnapshots.list);
    const { output } = await runAppWithOutput(app, [
      "broadcasts",
      "list",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/broadcasts");
    expect(output).toEqual(broadcastSnapshots.list);
  });

  it("get: calls API with id", async () => {
    mockSuccessResponse(broadcastSnapshots.get);
    const { output } = await runAppWithOutput(app, [
      "broadcasts",
      "get",
      "bc_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/broadcasts/bc_123");
    expect(output).toEqual(broadcastSnapshots.get);
  });
});
