import { afterAll, afterEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { disableFetchMocks } from "../test-utils/cli-mocks.js";
import { runAppWithOutput } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";
import { contactProperties as contactPropertySnapshots } from "../test-utils/snapshots.js";

describe("contact-properties", () => {
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("list: calls API and returns JSON", async () => {
    mockSuccessResponse(contactPropertySnapshots.list);
    const { output } = await runAppWithOutput(app, [
      "contact-properties",
      "list",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/contact-properties");
    expect(output).toMatchObject({
      object: "list",
      has_more: false,
      data: [{ id: "cp_1", key: "first_name", type: "string" }],
    });
  });

  it("get: calls API with id", async () => {
    mockSuccessResponse(contactPropertySnapshots.get);
    const { output } = await runAppWithOutput(app, [
      "contact-properties",
      "get",
      "cp_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      "/contact-properties/cp_123",
    );
    expect(output).toMatchObject({ id: "cp_1", key: "first_name" });
  });

  it("create: calls API with key and type", async () => {
    mockSuccessResponse(contactPropertySnapshots.create);
    const { output } = await runAppWithOutput(app, [
      "contact-properties",
      "create",
      "--key",
      "company",
      "--type",
      "string",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body).toMatchObject({ key: "company", type: "string" });
    expect(output).toMatchObject({ id: "cp_new" });
  });

  it("remove: calls API with id", async () => {
    mockSuccessResponse(contactPropertySnapshots.remove);
    const { output } = await runAppWithOutput(app, [
      "contact-properties",
      "remove",
      "cp_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      "/contact-properties/cp_123",
    );
    expect(output).toMatchObject({ id: "cp_123" });
  });
});
