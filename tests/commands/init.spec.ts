import { afterAll, afterEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { disableFetchMocks } from "../test-utils/cli-mocks.js";
import { runApp } from "../test-utils/helpers.js";

describe("init", () => {
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("--help prints init usage and does not call API", async () => {
    await expect(runApp(app, ["init", "--help"])).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
