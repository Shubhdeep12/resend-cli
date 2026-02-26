import { afterAll, afterEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { disableFetchMocks } from "../test-utils/cli-mocks.js";
import { runApp } from "../test-utils/helpers.js";

describe("login", () => {
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("--help prints login usage and does not call API", async () => {
    await expect(
      runApp(app, ["auth", "login", "--help"]),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
