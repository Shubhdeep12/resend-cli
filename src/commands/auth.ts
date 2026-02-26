import * as p from "@clack/prompts";
import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import { config } from "../lib/config.js";
import { stdout } from "../lib/logger.js";
import { formatError, formatSuccess, formatTable } from "../lib/output.js";

const stringParse = (s: string) => s;

const maskKey = (key: string): string => {
  if (key.length <= 10) return `${key.slice(0, 4)}***`;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
};

export const loginCommand = buildCommand({
  parameters: {
    flags: {
      key: {
        kind: "parsed",
        parse: stringParse,
        brief: "Resend API key (starts with re_)",
        optional: true,
      },
      name: {
        kind: "parsed",
        parse: stringParse,
        brief: "Name for this saved key",
        optional: true,
      },
    },
    aliases: { k: "key", n: "name" },
  },
  docs: { brief: "Save/select an API key for CLI usage" },
  func: async (flags: { key?: string; name?: string }) => {
    const saved = config.listKeys();
    const selected = config.selectedKeyName;
    let name = flags.name?.trim();
    let apiKey = flags.key?.trim();

    if (!apiKey && saved.length > 0) {
      const action = await p.select({
        message: "You already have saved keys. What do you want to do?",
        options: [
          { label: "Use existing key", value: "use" },
          { label: "Add new key", value: "add" },
          { label: "Replace active key", value: "replace" },
        ],
      });

      if (p.isCancel(action)) {
        p.cancel("Login cancelled.");
        process.exit(0);
      }

      if (action === "use") {
        if (name) {
          if (!config.selectKey(name)) {
            stdout(formatError(`No saved key found with name '${name}'.`));
            return;
          }
          stdout(formatSuccess(`Selected '${name}' as active key.`));
          return;
        }

        if (selected) {
          stdout(formatSuccess(`Already using '${selected}'.`));
          return;
        }

        if (saved.length === 1) {
          config.selectKey(saved[0].name);
          stdout(formatSuccess(`Selected '${saved[0].name}' as active key.`));
          return;
        }

        const picked = await p.select({
          message: "Select a saved key:",
          options: saved.map((item) => ({
            label: item.name,
            value: item.name,
          })),
        });
        if (p.isCancel(picked)) {
          p.cancel("Login cancelled.");
          process.exit(0);
        }
        config.selectKey(picked as string);
        stdout(formatSuccess(`Selected '${picked as string}' as active key.`));
        return;
      }

      if (action === "replace") {
        if (!name) {
          name = selected ?? saved[0]?.name ?? "default";
        }
      }

      if (action === "add" && !name) {
        const defaultName = saved.some((item) => item.name === "default")
          ? `key-${saved.length + 1}`
          : "default";
        const nameInput = await p.text({
          message: "Name for this key:",
          initialValue: "defaultName",
          validate: (value: string) => {
            if (!value.trim()) return "Key name is required";
          },
        });
        if (p.isCancel(nameInput)) {
          p.cancel("Login cancelled.");
          process.exit(0);
        }
        name = (nameInput as string).trim();
      }
    }

    if (!apiKey) {
      const entered = await p.text({
        message: "Enter your Resend API key:",
        validate: (value: string) => {
          if (!value) return "API key is required";
          if (!value.startsWith("re_")) return "API key must start with re_";
        },
      });
      if (p.isCancel(entered)) {
        p.cancel("Login cancelled.");
        process.exit(0);
      }
      apiKey = entered as string;
    }

    if (!apiKey.startsWith("re_")) {
      stdout(formatError("API key must start with re_"));
      return;
    }

    if (!name) {
      name = saved.length === 0 ? "default" : selected?.trim() || "default";
    }

    config.saveKey(name, apiKey);
    config.selectKey(name);

    stdout(formatSuccess(`Saved key '${name}' and made it active.`));
    stdout(`Active key: ${pc.cyan(name)} (${pc.dim(maskKey(apiKey))})`);
  },
});

export const logoutCommand = buildCommand({
  parameters: {
    flags: {
      name: {
        kind: "parsed",
        parse: stringParse,
        brief: "Remove a specific saved key name",
        optional: true,
      },
      all: {
        kind: "boolean",
        brief: "Remove all saved keys",
        optional: true,
      },
    },
    aliases: { n: "name" },
  },
  docs: { brief: "Remove saved key(s) from local CLI config" },
  func: async (flags: { name?: string; all?: boolean }) => {
    if (flags.all) {
      config.clearSavedKeys();
      stdout(formatSuccess("Removed all saved keys."));
      return;
    }

    if (flags.name) {
      const removed = config.removeKey(flags.name);
      if (!removed) {
        stdout(formatError(`No saved key found with name '${flags.name}'.`));
        return;
      }
      stdout(formatSuccess(`Removed saved key '${flags.name}'.`));
      return;
    }

    const selected = config.selectedKeyName;
    if (!selected) {
      if (process.env.RESEND_API_KEY) {
        stdout(
          pc.yellow(
            "RESEND_API_KEY is currently active from environment. Unset it to log out from env-based auth.",
          ),
        );
        return;
      }
      stdout(formatError("No active saved key to log out."));
      return;
    }

    config.removeKey(selected);
    stdout(formatSuccess(`Removed active saved key '${selected}'.`));
  },
});

export const whoamiCommand = buildCommand({
  parameters: {
    flags: {},
  },
  docs: { brief: "Show current auth source and selected key" },
  func: async () => {
    const envKey = process.env.RESEND_API_KEY;
    const selected = config.selectedKeyName;
    const current = config.apiKey;

    if (!current) {
      stdout(
        formatError(
          "Not logged in. Run `resend auth login` or set RESEND_API_KEY.",
        ),
      );
      return;
    }

    const source = envKey ? "environment" : "saved";
    stdout(pc.cyan("Current auth"));
    stdout(`Source: ${source}`);
    if (selected) {
      stdout(`Selected key: ${selected}`);
    }
    stdout(`Token: ${pc.dim(maskKey(current))}`);
  },
});

export const listCommand = buildCommand({
  parameters: {
    flags: {},
  },
  docs: { brief: "List saved API keys" },
  func: async () => {
    const saved = config.listKeys();
    const selected = config.selectedKeyName;

    if (!saved.length) {
      stdout(pc.yellow("No saved keys. Run `resend auth login` to add one."));
      if (process.env.RESEND_API_KEY) {
        stdout(
          `Environment key is set: ${pc.dim(maskKey(process.env.RESEND_API_KEY))}`,
        );
      }
      return;
    }

    const table = formatTable(
      ["Name", "Token", "Selected"],
      saved.map((item) => [
        item.name,
        maskKey(item.key),
        item.name === selected ? "yes" : "",
      ]),
    );
    stdout(table);

    if (process.env.RESEND_API_KEY) {
      stdout(
        pc.dim(
          "\nRESEND_API_KEY is set and overrides saved keys for this process.",
        ),
      );
    }
  },
});

export const selectCommand = buildCommand({
  parameters: {
    flags: {},
    positional: {
      kind: "tuple",
      parameters: [
        { parse: stringParse, brief: "Saved key name", placeholder: "name" },
      ],
    },
  },
  docs: { brief: "Select the active saved API key" },
  func: async (_flags: Record<string, unknown>, name: string) => {
    const ok = config.selectKey(name);
    if (!ok) {
      stdout(formatError(`No saved key found with name '${name}'.`));
      return;
    }

    const key = config.getKey(name);
    stdout(formatSuccess(`Selected '${name}' as active key.`));
    if (key) {
      stdout(`Active token: ${pc.dim(maskKey(key))}`);
    }
  },
});

export const authRouteMap = buildRouteMap({
  routes: {
    login: loginCommand,
    logout: logoutCommand,
    whoami: whoamiCommand,
    list: listCommand,
    select: selectCommand,
  },
  docs: { brief: "Manage local CLI authentication" },
});
