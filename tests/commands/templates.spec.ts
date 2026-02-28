import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import {
  disableFetchMocks,
  enableFetchMocks,
  resetConfigMock,
} from "../test-utils/cli-mocks.js";
import { runAppWithOutput } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";
import { templates as templateSnapshots } from "../test-utils/snapshots.js";

describe("templates", () => {
  beforeEach(() => {
    enableFetchMocks();
    resetConfigMock();
  });
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("list: calls API and returns JSON", async () => {
    mockSuccessResponse(templateSnapshots.list);
    const { output } = await runAppWithOutput(app, [
      "templates",
      "list",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/templates");
    expect(output).toEqual(templateSnapshots.list);
  });

  it("get: calls API with id", async () => {
    mockSuccessResponse(templateSnapshots.get);
    const { output } = await runAppWithOutput(app, [
      "templates",
      "get",
      "tmpl_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/templates/tmpl_123");
    expect(output).toMatchObject({ id: "tmpl_1" });
  });

  it("create: calls API with name and html", async () => {
    mockSuccessResponse(templateSnapshots.create);
    const { output } = await runAppWithOutput(app, [
      "templates",
      "create",
      "--name",
      "My Template",
      "--html",
      "<p>Hello</p>",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body).toMatchObject({ name: "My Template", html: "<p>Hello</p>" });
    expect(output).toMatchObject({ id: "tmpl_new" });
  });

  it("update: calls API with id and name", async () => {
    mockSuccessResponse(templateSnapshots.update);
    const { output } = await runAppWithOutput(app, [
      "templates",
      "update",
      "tmpl_123",
      "--name",
      "Updated Name",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body.name).toBe("Updated Name");
    expect(output).toMatchObject({ id: "tmpl_123" });
  });

  it("remove: calls API with id", async () => {
    mockSuccessResponse(templateSnapshots.remove);
    const { output } = await runAppWithOutput(app, [
      "templates",
      "remove",
      "tmpl_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/templates/tmpl_123");
    expect(output).toMatchObject({ id: "tmpl_123" });
  });

  it("duplicate: calls API with id", async () => {
    mockSuccessResponse(templateSnapshots.duplicate);
    const { output } = await runAppWithOutput(app, [
      "templates",
      "duplicate",
      "tmpl_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      "/templates/tmpl_123/duplicate",
    );
    expect(output).toMatchObject({ id: "tmpl_copy" });
  });

  it("publish: calls API with id", async () => {
    mockSuccessResponse(templateSnapshots.publish);
    const { output } = await runAppWithOutput(app, [
      "templates",
      "publish",
      "tmpl_123",
      "--json",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      "/templates/tmpl_123/publish",
    );
    expect(output).toMatchObject({ id: "tmpl_123" });
  });
});
