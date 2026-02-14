import { beforeAll, describe, expect, it } from "vitest";
import { ensureBuild, runCli } from "./test-utils/helpers.js";

describe("Resend CLI (app)", () => {
  beforeAll(() => ensureBuild());

  describe("help and version", () => {
    it("--help prints usage and lists commands", () => {
      const { stdout, status } = runCli(["--help"]);
      expect(status).toBe(0);
      expect(stdout).toContain("USAGE");
      expect(stdout).toContain("resend init");
      expect(stdout).toContain("resend emails");
      expect(stdout).toContain("resend domains");
      expect(stdout).toContain("resend contacts");
      expect(stdout).toContain("resend webhooks");
      expect(stdout).toContain("resend keys");
      expect(stdout).toContain("resend segments");
      expect(stdout).toContain("resend templates");
      expect(stdout).toContain("--help");
      expect(stdout).toContain("--version");
    });

    it("--version prints semver", () => {
      const { stdout, status } = runCli(["--version"]);
      expect(status).toBe(0);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe("unknown command", () => {
    it("exits non-zero and prints error", () => {
      const { stderr, status } = runCli(["unknown-command"]);
      expect(status).not.toBe(0);
      expect(stderr).toBeTruthy();
    });
  });
});
