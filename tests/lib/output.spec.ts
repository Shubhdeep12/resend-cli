import { describe, expect, it } from "vitest";
import { formatError, formatSuccess, formatTable } from "#/lib/output.js";

describe("output", () => {
  describe("formatTable", () => {
    it("returns table string with headers and rows", () => {
      const out = formatTable(
        ["A", "B"],
        [
          ["1", "2"],
          ["3", "4"],
        ],
      );
      expect(out).toContain("A");
      expect(out).toContain("B");
      expect(out).toContain("1");
      expect(out).toContain("3");
    });

    it("handles empty rows", () => {
      const out = formatTable(["H1", "H2"], []);
      expect(out).toContain("H1");
      expect(out).toContain("H2");
    });
  });

  describe("formatError", () => {
    it("prepends Error: to message", () => {
      const out = formatError("something went wrong");
      expect(out).toContain("Error:");
      expect(out).toContain("something went wrong");
    });
  });

  describe("formatSuccess", () => {
    it("prepends Success: to message", () => {
      const out = formatSuccess("done");
      expect(out).toContain("Success:");
      expect(out).toContain("done");
    });
  });
});
