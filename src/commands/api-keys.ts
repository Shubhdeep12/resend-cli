import * as p from "@clack/prompts";
import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import type {
  ApiKey,
  CreateApiKeyOptions,
  CreateApiKeyResponseSuccess,
} from "resend";
import { ResendClient } from "../lib/api.js";
import { stdout } from "../lib/logger.js";
import { formatError, formatSuccess, formatTable } from "../lib/output.js";
import { createSpinner } from "../lib/ui.js";
import { parseLimit, parseString } from "../lib/validators/index.js";

export const apiKeysRouteMap = buildRouteMap({
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
      docs: { brief: "List all API keys (supports pagination)" },
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
        s.start("Fetching API keys...");
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
          const { data, error } = await resend.apiKeys.list(listParams);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("API keys fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data?.length) {
            const table = formatTable(
              ["ID", "Name", "Created At"],
              data.data.map((k: ApiKey) => [
                k.id,
                k.name,
                new Date(k.created_at).toLocaleString(),
              ]),
            );
            stdout(table);
          } else {
            stdout(pc.yellow("No API keys found"));
          }
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    create: buildCommand({
      parameters: {
        flags: {
          name: { kind: "parsed", parse: parseString, brief: "API key name" },
          permission: {
            kind: "parsed",
            parse: parseString,
            brief: "Permission level (full_access, sending_access)",
            optional: true,
          },
          domainId: {
            kind: "parsed",
            parse: parseString,
            brief: "Domain ID to restrict key to",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { n: "name", p: "permission", d: "domainId" },
      },
      docs: { brief: "Create a new API key" },
      func: async (flags: {
        name: string;
        permission?: string;
        domainId?: string;
        json?: boolean;
      }) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start("Creating API key...");
        try {
          const resend = ResendClient.getInstance();
          const payload: CreateApiKeyOptions = {
            name: flags.name,
            ...(flags.permission && {
              permission: flags.permission as CreateApiKeyOptions["permission"],
            }),
            ...(flags.domainId && { domain_id: flags.domainId }),
          };
          const { data, error } = await resend.apiKeys.create(payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`API key created! ID: ${data?.id}`));
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
          } else {
            const details = data as CreateApiKeyResponseSuccess;
            stdout(pc.cyan("\nAPI Key Details:"));
            stdout(`${pc.bold("ID:")} ${details.id}`);
            stdout(`${pc.bold("Name:")} ${flags.name}`);
            stdout(`${pc.bold("Token:")} ${pc.red(details.token)}`);
            stdout(
              pc.yellow(
                "\nImportant: save this token now - it won't be shown again.",
              ),
            );
          }
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    delete: buildCommand({
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
            { parse: parseString, brief: "API key ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Delete an API key" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Deleting API key ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.apiKeys.remove(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("API key deleted!"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: "Manage API keys" },
});
