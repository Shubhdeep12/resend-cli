import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { disableFetchMocks, resetConfigMock } from "../test-utils/cli-mocks.js";
import { runAppWithOutput } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";
import { segments as segmentSnapshots } from "../test-utils/snapshots.js";

describe("segments", () => {
  beforeEach(resetConfigMock);
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("list: calls API and returns JSON", async () => {
    mockSuccessResponse(segmentSnapshots.list);
    const { output } = await runAppWithOutput(app, [
      "segments",
      "list",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/segments");
    expect(output).toEqual(segmentSnapshots.list);
  });

  it("get: calls API with id", async () => {
    mockSuccessResponse(segmentSnapshots.get);
    const { output } = await runAppWithOutput(app, [
      "segments",
      "get",
      "seg_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/segments/seg_123");
    expect(output).toMatchObject({ id: "seg_1" });
  });

  it("create: calls API with name", async () => {
    mockSuccessResponse(segmentSnapshots.create);
    const { output } = await runAppWithOutput(app, [
      "segments",
      "create",
      "--name",
      "My Segment",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body).toMatchObject({ name: "My Segment" });
    expect(output).toMatchObject({ id: "seg_new" });
  });

  it("remove: calls API with id", async () => {
    mockSuccessResponse(segmentSnapshots.remove);
    const { output } = await runAppWithOutput(app, [
      "segments",
      "remove",
      "seg_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/segments/seg_123");
    expect(output).toMatchObject({ id: "seg_123" });
  });
});
