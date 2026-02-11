import * as p from "@clack/prompts";
import { buildCommand } from "@stricli/core";
import pc from "picocolors";
import { config } from "../lib/config.js";
import { stdout } from "../lib/logger.js";

const ENV_DOC = `
Environment variables (optional overrides):
  RESEND_API_KEY    - API key (required if not set via init; used by Resend SDK)
  RESEND_BASE_URL   - Override API base URL (default: https://api.resend.com)
  RESEND_USER_AGENT - Override User-Agent (default: resend-node:<version>)

Config file (saved by init): platform-specific, e.g. ~/.config/resend-cli/config.json
`;

export const initCommand = buildCommand({
  parameters: {
    flags: {
      "write-env": {
        kind: "boolean",
        brief:
          "Write RESEND_API_KEY to .env in current directory (if not present)",
        optional: true,
      },
    },
  },
  docs: {
    brief:
      "Initialize Resend CLI: set API key and document env vars (RESEND_API_KEY, RESEND_BASE_URL, RESEND_USER_AGENT)",
  },
  func: async (flags: { "write-env"?: boolean }) => {
    p.intro(pc.cyan("Resend CLI Initialization"));

    const apiKey = await p.text({
      message: "Enter your Resend API Key:",
      validate: (value: string) => {
        if (!value) return "API Key is required";
        if (!value.startsWith("re_"))
          return "Invalid API Key format (should start with re_)";
      },
    });

    if (p.isCancel(apiKey)) {
      p.cancel("Initialization cancelled.");
      process.exit(0);
    }

    config.apiKey = apiKey as string;

    if (flags["write-env"]) {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const envPath = path.join(process.cwd(), ".env");
      try {
        let content = "";
        try {
          content = await fs.readFile(envPath, "utf-8");
        } catch {
          // .env may not exist
        }
        if (!content.includes("RESEND_API_KEY=")) {
          const line = `RESEND_API_KEY=${apiKey}\n`;
          await fs.appendFile(
            envPath,
            content ? (content.endsWith("\n") ? line : `\n${line}`) : line,
          );
          p.note("Appended RESEND_API_KEY to .env", "Config");
        } else {
          p.note(
            ".env already contains RESEND_API_KEY; not overwriting.",
            "Config",
          );
        }
      } catch (e) {
        stdout(pc.yellow(`Could not write .env: ${(e as Error).message}`));
      }
    }

    p.outro(pc.green("Successfully initialized! You can now use the CLI."));
    stdout(pc.dim(ENV_DOC.trim()));
  },
});
