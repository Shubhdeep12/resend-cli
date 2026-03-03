import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { app } from "#/app.js";
import {
  disableFetchMocks,
  enableFetchMocks,
  resetConfigMock,
} from "../test-utils/cli-mocks.js";
import { runAppWithOutput, runAppWithStdout } from "../test-utils/helpers.js";
import {
  mockErrorResponse,
  mockSuccessResponse,
} from "../test-utils/mock-fetch.js";
import { templates as templateSnapshots } from "../test-utils/snapshots.js";

vi.mock("#/lib/browser.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("#/lib/browser.js")>();
  return {
    ...mod,
    openInBrowser: vi.fn(() => true),
  };
});

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

  describe("open", () => {
    const validUuid = "883c4f07-a62e-4a13-9d84-7bf30b9cb8e7";

    it("by ID: calls get, prints editor URL", async () => {
      mockSuccessResponse(templateSnapshots.get);
      const { stdout } = await runAppWithStdout(app, [
        "templates",
        "open",
        validUuid,
        "--no-open",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toContain(`/templates/${validUuid}`);
      expect(stdout).toContain(
        `https://resend.com/templates/${validUuid}/editor`,
      );
    });

    it("by ID: when get returns 404, prints error", async () => {
      mockErrorResponse(
        {
          name: "not_found",
          message: "Template not found",
          statusCode: 404,
        },
        { status: 404 },
      );
      const { stdout } = await runAppWithStdout(app, [
        "templates",
        "open",
        validUuid,
        "--no-open",
      ]);
      expect(stdout).toContain(`No template found with ID "${validUuid}"`);
    });

    it("by name: resolves from list, prints editor URL", async () => {
      mockSuccessResponse(templateSnapshots.list);
      const { stdout } = await runAppWithStdout(app, [
        "templates",
        "open",
        "Welcome",
        "--no-open",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toContain("/templates");
      expect(stdout).toContain("https://resend.com/templates/tmpl_1/editor");
    });

    it("by name: when no match, prints error", async () => {
      mockSuccessResponse(templateSnapshots.list);
      const { stdout } = await runAppWithStdout(app, [
        "templates",
        "open",
        "NonExistent",
        "--no-open",
      ]);
      expect(stdout).toContain('No template found with name "NonExistent"');
    });

    it("by name: when multiple matches, prints error with hint", async () => {
      mockSuccessResponse({
        object: "list" as const,
        has_more: false,
        data: [
          {
            id: "tmpl_1",
            name: "Dup",
            status: "published" as const,
            alias: null,
            updated_at: "2025-01-01T00:00:00Z",
            created_at: "2025-01-01T00:00:00Z",
            published_at: "2025-01-01T00:00:00Z",
          },
          {
            id: "tmpl_2",
            name: "Dup",
            status: "published" as const,
            alias: null,
            updated_at: "2025-01-01T00:00:00Z",
            created_at: "2025-01-01T00:00:00Z",
            published_at: "2025-01-01T00:00:00Z",
          },
        ],
      });
      const { stdout } = await runAppWithStdout(app, [
        "templates",
        "open",
        "Dup",
        "--no-open",
      ]);
      expect(stdout).toContain('Multiple templates named "Dup"');
      expect(stdout).toContain("Use ID: tmpl_1");
    });
  });
});
