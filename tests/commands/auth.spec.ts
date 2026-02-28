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
import { runApp } from "../test-utils/helpers.js";

describe("auth commands", () => {
  beforeEach(() => {
    enableFetchMocks();
    resetConfigMock();
  });
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  it("login: saves key without calling API", async () => {
    await expect(
      runApp(app, ["auth", "login", "--key", "re_test_key", "--name", "work"]),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("login: --help prints usage and does not call API", async () => {
    await expect(
      runApp(app, ["auth", "login", "--help"]),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("list/whoami/select/logout run locally without API", async () => {
    await expect(runApp(app, ["auth", "list"])).resolves.toBeUndefined();
    await expect(runApp(app, ["auth", "whoami"])).resolves.toBeUndefined();
    await expect(
      runApp(app, ["auth", "select", "default"]),
    ).resolves.toBeUndefined();
    await expect(
      runApp(app, ["auth", "logout", "--all"]),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("logout --name removes a named key and handles unknown names", async () => {
    await expect(
      runApp(app, ["auth", "login", "--key", "re_test_key", "--name", "dev"]),
    ).resolves.toBeUndefined();
    await expect(
      runApp(app, ["auth", "logout", "--name", "dev"]),
    ).resolves.toBeUndefined();
    await expect(
      runApp(app, ["auth", "logout", "--name", "missing"]),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("after logout --all, first login without --name uses default", async () => {
    const writeSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await runApp(app, [
      "auth",
      "login",
      "--key",
      "re_test_key",
      "--name",
      "default",
    ]);
    await runApp(app, [
      "auth",
      "login",
      "--key",
      "re_test_key",
      "--name",
      "test",
    ]);
    await runApp(app, ["auth", "logout", "--all"]);
    await runApp(app, ["auth", "login", "--key", "re_test_key"]);

    const output = writeSpy.mock.calls
      .map((call) => (typeof call[0] === "string" ? call[0] : String(call[0])))
      .join("");
    writeSpy.mockRestore();

    expect(output).toContain("Saved key 'default' and made it active.");
  });
});
