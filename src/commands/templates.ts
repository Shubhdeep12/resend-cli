import * as fs from "node:fs/promises";
import * as p from "@clack/prompts";
import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import type {
  CreateTemplateOptions,
  ListTemplatesResponseSuccess,
  Template,
} from "resend";
import { ResendClient } from "../lib/api.js";
import { stdout } from "../lib/logger.js";
import { formatError, formatSuccess, formatTable } from "../lib/output.js";
import { createSpinner } from "../lib/ui.js";
import { parseLimit, parseString } from "../lib/validators/index.js";

export const templatesRouteMap = buildRouteMap({
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
      docs: { brief: "List templates (supports pagination)" },
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
        s.start("Fetching templates...");
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
          const { data, error } = await resend.templates.list(listParams);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Templates fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const listData = data as ListTemplatesResponseSuccess | null;
          if (listData?.data?.length) {
            const table = formatTable(
              ["ID", "Name", "Status", "Alias", "Updated"],
              listData.data.map((t) => [
                t.id,
                t.name,
                t.status,
                t.alias ?? "-",
                new Date(t.updated_at).toLocaleString(),
              ]),
            );
            stdout(table);
          } else {
            stdout(pc.yellow("No templates found"));
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
              brief: "Template ID",
              placeholder: "id",
            },
          ],
        },
      },
      docs: { brief: "Get template by ID" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Fetching template ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.templates.get(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Template fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const t = data as Template;
          stdout(pc.cyan("\nTemplate:"));
          stdout(`${pc.bold("ID:")} ${t.id}`);
          stdout(`${pc.bold("Name:")} ${t.name}`);
          stdout(`${pc.bold("Status:")} ${t.status}`);
          stdout(`${pc.bold("Subject:")} ${t.subject ?? "-"}`);
          stdout(`${pc.bold("Alias:")} ${t.alias ?? "-"}`);
          stdout(`${pc.bold("From:")} ${t.from ?? "-"}`);
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    create: buildCommand({
      parameters: {
        flags: {
          name: {
            kind: "parsed",
            parse: parseString,
            brief: "Template name",
            optional: true,
          },
          html: {
            kind: "parsed",
            parse: parseString,
            brief: "HTML content",
            optional: true,
          },
          htmlFile: {
            kind: "parsed",
            parse: parseString,
            brief: "Path to HTML file",
            optional: true,
          },
          subject: {
            kind: "parsed",
            parse: parseString,
            brief: "Default subject",
            optional: true,
          },
          text: {
            kind: "parsed",
            parse: parseString,
            brief: "Plain text content",
            optional: true,
          },
          from: {
            kind: "parsed",
            parse: parseString,
            brief: "Default from address",
            optional: true,
          },
          alias: {
            kind: "parsed",
            parse: parseString,
            brief: "Template alias",
            optional: true,
          },
          replyTo: {
            kind: "parsed",
            parse: parseString,
            brief: "Reply-To (comma-separated or JSON array)",
            optional: true,
          },
          variables: {
            kind: "parsed",
            parse: parseString,
            brief: "Variables as JSON array",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { n: "name" },
      },
      docs: {
        brief: "Create a template (--name and --html or --html-file required)",
      },
      func: async (flags: {
        name?: string;
        html?: string;
        htmlFile?: string;
        subject?: string;
        text?: string;
        from?: string;
        alias?: string;
        replyTo?: string;
        variables?: string;
        json?: boolean;
      }) => {
        if (!flags.name) {
          stdout(formatError("--name is required"));
          return;
        }
        let html = flags.html;
        if (flags.htmlFile) {
          try {
            html = await fs.readFile(flags.htmlFile, "utf-8");
          } catch (e) {
            stdout(
              formatError(
                `Failed to read --html-file: ${(e as Error).message}`,
              ),
            );
            return;
          }
        }
        if (!html) {
          stdout(formatError("Provide --html or --html-file"));
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start("Creating template...");
        try {
          const resend = ResendClient.getInstance();
          const payload: {
            name: string;
            html: string;
            subject?: string;
            text?: string;
            from?: string;
            alias?: string;
            replyTo?: string | string[];
            variables?: {
              key: string;
              type: "string" | "number";
              fallbackValue?: string | number | null;
            }[];
          } = { name: flags.name, html };
          if (flags.subject) payload.subject = flags.subject;
          if (flags.text) payload.text = flags.text;
          if (flags.from) payload.from = flags.from;
          if (flags.alias) payload.alias = flags.alias;
          if (flags.replyTo) {
            try {
              const parsed = JSON.parse(flags.replyTo) as unknown;
              payload.replyTo = Array.isArray(parsed)
                ? parsed
                : flags.replyTo.split(",").map((x) => x.trim());
            } catch {
              payload.replyTo = flags.replyTo.split(",").map((x) => x.trim());
            }
          }
          if (flags.variables) {
            try {
              payload.variables = JSON.parse(flags.variables) as {
                key: string;
                type: "string" | "number";
                fallbackValue?: string | number | null;
              }[];
            } catch {
              stdout(
                formatError(
                  "--variables must be a JSON array of { key, type, fallbackValue? }",
                ),
              );
              return;
            }
          }
          const result = await resend.templates.create(
            payload as CreateTemplateOptions,
          );
          const { data, error } = result;
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Template created! ID: ${data?.id}`));
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
          name: {
            kind: "parsed",
            parse: parseString,
            brief: "Template name",
            optional: true,
          },
          html: {
            kind: "parsed",
            parse: parseString,
            brief: "HTML content",
            optional: true,
          },
          htmlFile: {
            kind: "parsed",
            parse: parseString,
            brief: "Path to HTML file",
            optional: true,
          },
          subject: {
            kind: "parsed",
            parse: parseString,
            brief: "Default subject",
            optional: true,
          },
          text: {
            kind: "parsed",
            parse: parseString,
            brief: "Plain text content",
            optional: true,
          },
          from: {
            kind: "parsed",
            parse: parseString,
            brief: "Default from address",
            optional: true,
          },
          alias: {
            kind: "parsed",
            parse: parseString,
            brief: "Template alias",
            optional: true,
          },
          replyTo: {
            kind: "parsed",
            parse: parseString,
            brief: "Reply-To",
            optional: true,
          },
          variables: {
            kind: "parsed",
            parse: parseString,
            brief: "Variables as JSON array",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { n: "name" },
        positional: {
          kind: "tuple",
          parameters: [
            { parse: parseString, brief: "Template ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Update a template" },
      func: async (
        flags: {
          name?: string;
          html?: string;
          htmlFile?: string;
          subject?: string;
          text?: string;
          from?: string;
          alias?: string;
          replyTo?: string;
          variables?: string;
          json?: boolean;
        },
        id: string,
      ) => {
        let html = flags.html;
        if (flags.htmlFile) {
          try {
            html = await fs.readFile(flags.htmlFile, "utf-8");
          } catch (e) {
            stdout(
              formatError(
                `Failed to read --html-file: ${(e as Error).message}`,
              ),
            );
            return;
          }
        }
        const hasAny =
          flags.name !== undefined ||
          html !== undefined ||
          flags.subject !== undefined ||
          flags.text !== undefined ||
          flags.from !== undefined ||
          flags.alias !== undefined ||
          flags.replyTo !== undefined ||
          flags.variables !== undefined;
        if (!hasAny) {
          stdout(formatError("Provide at least one field to update"));
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Updating template ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const payload: Record<string, unknown> = {};
          if (flags.name !== undefined) payload.name = flags.name;
          if (html !== undefined) payload.html = html;
          if (flags.subject !== undefined) payload.subject = flags.subject;
          if (flags.text !== undefined) payload.text = flags.text;
          if (flags.from !== undefined) payload.from = flags.from;
          if (flags.alias !== undefined) payload.alias = flags.alias;
          if (flags.replyTo !== undefined) {
            try {
              const parsed = JSON.parse(flags.replyTo) as unknown;
              payload.replyTo = Array.isArray(parsed)
                ? parsed
                : flags.replyTo.split(",").map((x) => x.trim());
            } catch {
              payload.replyTo = flags.replyTo.split(",").map((x) => x.trim());
            }
          }
          if (flags.variables !== undefined) {
            try {
              payload.variables = JSON.parse(flags.variables) as {
                key: string;
                type: string;
                fallbackValue?: string | number | null;
              }[];
            } catch {
              stdout(formatError("--variables must be a JSON array"));
              return;
            }
          }
          const { data, error } = await resend.templates.update(id, payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Template updated"));
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
            { parse: parseString, brief: "Template ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Remove a template" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Removing template ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.templates.remove(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Template removed"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    duplicate: buildCommand({
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
            { parse: parseString, brief: "Template ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Duplicate a template" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Duplicating template ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const result = await resend.templates.duplicate(id);
          const { data, error } = await result;
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Template duplicated! ID: ${data?.id}`));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    publish: buildCommand({
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
            { parse: parseString, brief: "Template ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Publish a template" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Publishing template ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.templates.publish(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Template published"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: "Manage email templates (HTML only; no React)" },
});
