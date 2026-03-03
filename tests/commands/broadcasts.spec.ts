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
import { broadcasts as broadcastSnapshots } from "../test-utils/snapshots.js";

vi.mock("#/lib/browser.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("#/lib/browser.js")>();
  return {
    ...mod,
    openInBrowser: vi.fn(() => true),
  };
});

describe("broadcasts", () => {
  beforeEach(() => {
    enableFetchMocks();
    resetConfigMock();
  });
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

  describe("open", () => {
    const validUuid = "21a96c6b-3312-4ea0-8e6e-1a6dd25eaa2f";

    it("by ID: calls get, prints editor URL", async () => {
      mockSuccessResponse(broadcastSnapshots.get);
      const { stdout } = await runAppWithStdout(app, [
        "broadcasts",
        "open",
        validUuid,
        "--no-open",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toContain(
        `/broadcasts/${validUuid}`,
      );
      expect(stdout).toContain(
        `https://resend.com/broadcasts/${validUuid}/editor`,
      );
    });

    it("by ID: when get returns 404, prints error", async () => {
      mockErrorResponse(
        { name: "not_found", message: "Broadcast not found", statusCode: 404 },
        { status: 404 },
      );
      const { stdout } = await runAppWithStdout(app, [
        "broadcasts",
        "open",
        validUuid,
        "--no-open",
      ]);
      expect(stdout).toContain(`No broadcast found with ID "${validUuid}"`);
    });

    it("by name: resolves from list, prints editor URL", async () => {
      mockSuccessResponse(broadcastSnapshots.list);
      const { stdout } = await runAppWithStdout(app, [
        "broadcasts",
        "open",
        "News",
        "--no-open",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toContain("/broadcasts");
      expect(stdout).toContain("https://resend.com/broadcasts/bc_1/editor");
    });

    it("by name: when no match, prints error", async () => {
      mockSuccessResponse(broadcastSnapshots.list);
      const { stdout } = await runAppWithStdout(app, [
        "broadcasts",
        "open",
        "NonExistent",
        "--no-open",
      ]);
      expect(stdout).toContain('No broadcast found with name "NonExistent"');
    });

    it("by name: when multiple matches, prints error with hint", async () => {
      mockSuccessResponse({
        object: "list" as const,
        has_more: false,
        data: [
          {
            id: "bc_1",
            name: "Dup",
            status: "draft" as const,
            segment_id: null,
            created_at: "2025-01-01",
            audience_id: "aud_abc",
            scheduled_at: null,
            sent_at: null,
          },
          {
            id: "bc_2",
            name: "Dup",
            status: "draft" as const,
            segment_id: null,
            created_at: "2025-01-01",
            audience_id: "aud_abc",
            scheduled_at: null,
            sent_at: null,
          },
        ],
      });
      const { stdout } = await runAppWithStdout(app, [
        "broadcasts",
        "open",
        "Dup",
        "--no-open",
      ]);
      expect(stdout).toContain('Multiple broadcasts named "Dup"');
      expect(stdout).toContain("Use ID: bc_1");
    });
  });
});
