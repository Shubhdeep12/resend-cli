import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import type { ContactProperty, CreateContactPropertyOptions } from "resend";
import { ResendClient } from "../lib/api.js";
import { stdout } from "../lib/logger.js";
import { formatError, formatSuccess, formatTable } from "../lib/output.js";
import { createSpinner } from "../lib/ui.js";
import { parseLimit, parseString } from "../lib/validators/index.js";

export const contactPropertiesRouteMap = buildRouteMap({
  routes: {
    list: buildCommand({
      parameters: {
        flags: {
          limit: {
            kind: "parsed",
            parse: parseLimit,
            brief: "Max items to return (1-100)",
            optional: true,
          },
          after: {
            kind: "parsed",
            parse: parseString,
            brief: "Cursor: get items after this ID",
            optional: true,
          },
          before: {
            kind: "parsed",
            parse: parseString,
            brief: "Cursor: get items before this ID",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { l: "limit" },
      },
      docs: { brief: "List contact properties (supports pagination)" },
      func: async (flags: {
        limit?: number;
        after?: string;
        before?: string;
        json?: boolean;
      }) => {
        if (flags.after != null && flags.before != null) {
          stdout(
            formatError(
              "Cannot use both --after and --before; use only one for pagination.",
            ),
          );
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start("Fetching contact properties...");
        try {
          const resend = ResendClient.getInstance();
          const listParams =
            flags.after != null
              ? {
                  ...(flags.limit != null && { limit: flags.limit }),
                  after: flags.after,
                }
              : flags.before != null
                ? {
                    ...(flags.limit != null && { limit: flags.limit }),
                    before: flags.before,
                  }
                : flags.limit != null
                  ? { limit: flags.limit }
                  : {};
          const { data, error } =
            await resend.contactProperties.list(listParams);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Contact properties fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data?.length) {
            const table = formatTable(
              ["ID", "Key", "Type", "Fallback value"],
              data.data.map((cp: ContactProperty) => [
                cp.id,
                cp.key,
                cp.type,
                cp.fallbackValue != null ? String(cp.fallbackValue) : "-",
              ]),
            );
            stdout(table);
          } else {
            stdout(pc.yellow("No contact properties found"));
          }
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    get: buildCommand({
      parameters: {
        flags: {
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        positional: {
          kind: "tuple",
          parameters: [
            {
              parse: parseString,
              brief: "Contact property ID",
              placeholder: "id",
            },
          ],
        },
      },
      docs: { brief: "Get contact property by ID" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Fetching contact property ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.contactProperties.get(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Contact property fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const cp = data as ContactProperty;
          stdout(pc.cyan("\nContact property:"));
          stdout(`${pc.bold("ID:")} ${cp.id}`);
          stdout(`${pc.bold("Key:")} ${cp.key}`);
          stdout(`${pc.bold("Type:")} ${cp.type}`);
          stdout(
            `${pc.bold("Fallback value:")} ${cp.fallbackValue != null ? String(cp.fallbackValue) : "-"}`,
          );
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    create: buildCommand({
      parameters: {
        flags: {
          key: {
            kind: "parsed",
            parse: parseString,
            brief: "Property key",
            optional: true,
          },
          type: {
            kind: "parsed",
            parse: parseString,
            brief: "string or number",
            optional: true,
          },
          fallbackValue: {
            kind: "parsed",
            parse: parseString,
            brief: "Fallback value (string or number)",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { k: "key", t: "type" },
      },
      docs: { brief: "Create a contact property (--key and --type required)" },
      func: async (flags: {
        key?: string;
        type?: string;
        fallbackValue?: string;
        json?: boolean;
      }) => {
        if (!flags.key) {
          stdout(formatError("--key is required"));
          return;
        }
        if (!flags.type || !["string", "number"].includes(flags.type)) {
          stdout(
            formatError("--type is required and must be string or number"),
          );
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start("Creating contact property...");
        try {
          const resend = ResendClient.getInstance();
          const payload: CreateContactPropertyOptions =
            flags.type === "number"
              ? {
                  key: flags.key,
                  type: "number",
                  ...(flags.fallbackValue !== undefined && {
                    fallbackValue: Number(flags.fallbackValue),
                  }),
                }
              : {
                  key: flags.key,
                  type: "string",
                  ...(flags.fallbackValue !== undefined && {
                    fallbackValue: flags.fallbackValue,
                  }),
                };
          const { data, error } =
            await resend.contactProperties.create(payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Contact property created! ID: ${data?.id}`));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    update: buildCommand({
      parameters: {
        flags: {
          fallbackValue: {
            kind: "parsed",
            parse: parseString,
            brief: "New fallback value",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        positional: {
          kind: "tuple",
          parameters: [
            {
              parse: parseString,
              brief: "Contact property ID",
              placeholder: "id",
            },
          ],
        },
      },
      docs: { brief: "Update a contact property (--fallback-value)" },
      func: async (
        flags: { fallbackValue?: string; json?: boolean },
        id: string,
      ) => {
        if (flags.fallbackValue === undefined) {
          stdout(formatError("--fallback-value is required for update"));
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Updating contact property ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const payload = { id, fallbackValue: flags.fallbackValue };
          const { data, error } =
            await resend.contactProperties.update(payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Contact property updated"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    remove: buildCommand({
      parameters: {
        flags: {
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        positional: {
          kind: "tuple",
          parameters: [
            {
              parse: parseString,
              brief: "Contact property ID",
              placeholder: "id",
            },
          ],
        },
      },
      docs: { brief: "Remove a contact property" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Removing contact property ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.contactProperties.remove(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Contact property removed"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: "Manage contact properties" },
});
