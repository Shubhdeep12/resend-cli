import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { disableFetchMocks, resetConfigMock } from "../test-utils/cli-mocks.js";
import { runAppWithOutput } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";
import { topics as topicSnapshots } from "../test-utils/snapshots.js";

describe("topics", () => {
  beforeEach(resetConfigMock);
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("list: calls API and returns JSON", async () => {
    mockSuccessResponse(topicSnapshots.list);
    const { output } = await runAppWithOutput(app, [
      "topics",
      "list",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/topics");
    expect(output).toEqual(topicSnapshots.list);
  });

  it("get: calls API with id", async () => {
    mockSuccessResponse(topicSnapshots.get);
    const { output } = await runAppWithOutput(app, [
      "topics",
      "get",
      "topic_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/topics/topic_123");
    expect(output).toMatchObject({ id: "topic_1" });
  });

  it("create: calls API with name and defaultSubscription", async () => {
    mockSuccessResponse(topicSnapshots.create);
    const { output } = await runAppWithOutput(app, [
      "topics",
      "create",
      "--name",
      "My Topic",
      "--defaultSubscription",
      "opt_in",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body).toMatchObject({ name: "My Topic" });
    expect(output).toMatchObject({ id: "topic_new" });
  });

  it("remove: calls API with id", async () => {
    mockSuccessResponse(topicSnapshots.remove);
    const { output } = await runAppWithOutput(app, [
      "topics",
      "remove",
      "topic_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/topics/topic_123");
    expect(output).toMatchObject({ id: "topic_123" });
  });
});
