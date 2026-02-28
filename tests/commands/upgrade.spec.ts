import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { resetConfigMock } from "../test-utils/cli-mocks.js";
import { runAppWithStdout } from "../test-utils/helpers.js";
import { mockSuccessResponse } from "../test-utils/mock-fetch.js";

describe("upgrade", () => {
  beforeEach(resetConfigMock);
  afterEach(() => fetchMock.resetMocks());

  it("upgrade check: when on latest, prints success", async () => {
    mockSuccessResponse({ version: "0.4.5" });
    const { stdout } = await runAppWithStdout(app, ["upgrade", "check"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(stdout).toContain("You're on the latest version");
  });

  it("upgrade check: when outdated, prints upgrade instructions", async () => {
    mockSuccessResponse({ version: "99.0.0" });
    const { stdout } = await runAppWithStdout(app, ["upgrade", "check"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(stdout).toContain("A new version");
    expect(stdout).toContain("99.0.0");
    expect(stdout).toContain("npm install -g");
    expect(stdout).toContain("@shubhdeep12/resend-cli");
  });

  it("upgrade check: when registry fails, prints error", async () => {
    fetchMock.mockReject(new Error("Network error"));
    const { stdout } = await runAppWithStdout(app, ["upgrade", "check"]);
    expect(stdout).toContain("Could not reach the registry");
  });
});
