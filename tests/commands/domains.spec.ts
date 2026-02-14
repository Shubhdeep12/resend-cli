import { afterAll, afterEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { disableFetchMocks } from "../test-utils/cli-mocks.js";
import { runAppWithOutput } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";
import { domains as domainSnapshots } from "../test-utils/snapshots.js";

describe("domains", () => {
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("list: calls API and returns JSON", async () => {
    mockSuccessResponse(domainSnapshots.list);
    const { output } = await runAppWithOutput(app, [
      "domains",
      "list",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/domains");
    expect(output).toEqual(domainSnapshots.list);
  });

  it("add: calls create API with name", async () => {
    mockSuccessResponse(domainSnapshots.create);
    const { output } = await runAppWithOutput(app, [
      "domains",
      "add",
      "example.com",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body).toMatchObject({ name: "example.com" });
    expect(output).toEqual(domainSnapshots.create);
  });

  it("verify: calls verify API with id", async () => {
    mockSuccessResponse(domainSnapshots.verify);
    const { output } = await runAppWithOutput(app, [
      "domains",
      "verify",
      "dom_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/domains/dom_123/verify");
    expect(output).toMatchObject({ id: "dom_1" });
  });
});
