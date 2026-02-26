import * as p from "@clack/prompts";
import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import type { Segment } from "resend";
import { ResendClient } from "../lib/api.js";
import { stdout } from "../lib/logger.js";
import { formatError, formatSuccess, formatTable } from "../lib/output.js";
import { parseLimit, parseString } from "../lib/validators/index.js";

export const segmentsRouteMap = buildRouteMap({
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
      docs: { brief: "List segments (supports pagination)" },
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
        const s = p.spinner();
        s.start("Fetching segments...");
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
          const { data, error } = await resend.segments.list(listParams);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Segments fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data?.length) {
            const table = formatTable(
              ["ID", "Name"],
              data.data.map((seg: Segment) => [seg.id, seg.name]),
            );
            stdout(table);
          } else {
            stdout(pc.yellow("No segments found"));
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
            { parse: parseString, brief: "Segment ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Get segment by ID" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = p.spinner();
        s.start(`Fetching segment ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.segments.get(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Segment fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const seg = data as Segment;
          stdout(pc.cyan("\nSegment:"));
          stdout(`${pc.bold("ID:")} ${seg.id}`);
          stdout(`${pc.bold("Name:")} ${seg.name}`);
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
            brief: "Segment name",
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
      docs: { brief: "Create a segment (--name required)" },
      func: async (flags: { name?: string; json?: boolean }) => {
        if (!flags.name) {
          stdout(formatError("--name is required"));
          return;
        }
        const s = p.spinner();
        s.start("Creating segment...");
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.segments.create({
            name: flags.name,
          });
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Segment created! ID: ${data?.id}`));
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
            { parse: parseString, brief: "Segment ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Remove a segment" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = p.spinner();
        s.start(`Removing segment ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.segments.remove(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Segment removed"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: "Manage segments (audiences)" },
});
