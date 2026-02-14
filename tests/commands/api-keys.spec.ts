import { afterAll, afterEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { disableFetchMocks } from "../test-utils/cli-mocks.js";
import { runAppWithOutput } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";
import { apiKeys as apiKeySnapshots } from "../test-utils/snapshots.js";

describe("keys (api-keys)", () => {
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("list: calls API and returns JSON", async () => {
    mockSuccessResponse(apiKeySnapshots.list);
    const { output } = await runAppWithOutput(app, ["keys", "list", "--json"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api-keys");
    expect(output).toEqual(apiKeySnapshots.list);
  });

  it("create: calls API with name", async () => {
    mockSuccessResponse(apiKeySnapshots.create, { status: 201 });
    const { output } = await runAppWithOutput(app, [
      "keys",
      "create",
      "--name",
      "My Key",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body).toMatchObject({ name: "My Key" });
    expect(output).toMatchObject({ id: "k_new" });
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
