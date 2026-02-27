import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { disableFetchMocks, resetConfigMock } from "../test-utils/cli-mocks.js";
import { runApp, runAppWithOutput } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";
import { contacts as contactSnapshots } from "../test-utils/snapshots.js";

describe("contacts", () => {
  beforeEach(resetConfigMock);
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("list: calls API with audience and returns JSON", async () => {
    mockSuccessResponse(contactSnapshots.list);
    const { output } = await runAppWithOutput(app, [
      "contacts",
      "list",
      "--audience",
      "aud_abc",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toMatch(
      /\/(segments|audiences)\/aud_abc\/contacts/,
    );
    expect(output).toEqual(contactSnapshots.list);
  });

  it("create: calls API with audience and email", async () => {
    mockSuccessResponse(contactSnapshots.create);
    await runApp(app, [
      "contacts",
      "create",
      "--audience",
      "aud_abc",
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
    expect(url).toMatch(/\/(segments|audiences)\/aud_abc\/contacts/);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body).toMatchObject({ email: "user@example.com" });
  });
});
