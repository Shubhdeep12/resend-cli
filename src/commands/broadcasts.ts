import * as fs from "node:fs/promises";
import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import type { Broadcast, ListBroadcastsResponseSuccess } from "resend";
import { ResendClient } from "../lib/api.js";
import { stdout } from "../lib/logger.js";
import { formatError, formatSuccess, formatTable } from "../lib/output.js";
import { createSpinner } from "../lib/ui.js";
import { parseLimit, parseString } from "../lib/validators/index.js";

export const broadcastsRouteMap = buildRouteMap({
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
      docs: { brief: "List broadcasts (supports pagination)" },
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
        s.start("Fetching broadcasts...");
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
          const { data, error } = await resend.broadcasts.list(listParams);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Broadcasts fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data) {
            type ListBroadcastItem =
              ListBroadcastsResponseSuccess["data"][number];
            const table = formatTable(
              ["ID", "Name", "Status", "Segment"],
              data.data.map((b: ListBroadcastItem) => [
                b.id,
                b.name ?? "-",
                b.status,
                b.segment_id ?? "All",
              ]),
            );
            stdout(table);
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
            { parse: parseString, brief: "Broadcast ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Get broadcast details" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Fetching broadcast ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.broadcasts.get(id);
          if (error) {
            s.stop(formatError(error.message));
            return;
          }
          s.stop("Broadcast details fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const broadcast = data as Broadcast;
          stdout(pc.cyan("\nBroadcast Details:"));
          stdout(`${pc.bold("ID:")} ${broadcast.id}`);
          stdout(`${pc.bold("Name:")} ${broadcast.name ?? "-"}`);
          stdout(`${pc.bold("Subject:")} ${broadcast.subject ?? "-"}`);
          stdout(`${pc.bold("Status:")} ${broadcast.status}`);
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
            brief: "Broadcast name",
            optional: true,
          },
          segmentId: {
            kind: "parsed",
            parse: parseString,
            brief: "Segment ID to send to",
            optional: true,
          },
          audience: {
            kind: "parsed",
            parse: parseString,
            brief: "(Deprecated) Audience ID – use --segment-id",
            optional: true,
          },
          from: {
            kind: "parsed",
            parse: parseString,
            brief: "Sender email address",
            optional: true,
          },
          subject: {
            kind: "parsed",
            parse: parseString,
            brief: "Email subject",
            optional: true,
          },
          html: {
            kind: "parsed",
            parse: parseString,
            brief: "HTML content",
            optional: true,
          },
          text: {
            kind: "parsed",
            parse: parseString,
            brief: "Plain text content",
            optional: true,
          },
          htmlFile: {
            kind: "parsed",
            parse: parseString,
            brief: "Path to HTML file",
            optional: true,
          },
          replyTo: {
            kind: "parsed",
            parse: parseString,
            brief: "Reply-to address(es), comma-separated",
            optional: true,
          },
          previewText: {
            kind: "parsed",
            parse: parseString,
            brief: "Preview text snippet",
            optional: true,
          },
          topicId: {
            kind: "parsed",
            parse: parseString,
            brief: "Topic ID",
            optional: true,
          },
          send: {
            kind: "boolean",
            brief: "Send immediately (default: create as draft)",
            optional: true,
          },
          scheduledAt: {
            kind: "parsed",
            parse: parseString,
            brief: "Schedule send time (ISO 8601 or relative)",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { s: "subject", f: "from" },
      },
      docs: { brief: "Create a broadcast (draft or send now)" },
      func: async (flags: {
        name?: string;
        segmentId?: string;
        audience?: string;
        from?: string;
        subject?: string;
        html?: string;
        text?: string;
        htmlFile?: string;
        replyTo?: string;
        previewText?: string;
        topicId?: string;
        send?: boolean;
        scheduledAt?: string;
        json?: boolean;
      }) => {
        if (!flags.segmentId && !flags.audience) {
          stdout(
            formatError("Provide --segment-id (or deprecated --audience)."),
          );
          return;
        }
        if (!flags.from || !flags.subject) {
          stdout(formatError("--from and --subject are required."));
          return;
        }
        const hasHtml = Boolean(flags.html || flags.htmlFile);
        const hasText = Boolean(flags.text);
        if (!hasHtml && !hasText) {
          stdout(
            formatError(
              "Provide at least one of: --html, --text, or --html-file.",
            ),
          );
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start("Creating broadcast...");
        try {
          const resend = ResendClient.getInstance();
          let html = flags.html;
          if (flags.htmlFile) {
            try {
              html = await fs.readFile(flags.htmlFile, "utf-8");
            } catch (err) {
              s.stop(
                formatError(
                  `Failed to read --html-file: ${(err as Error).message}`,
                ),
              );
              return;
            }
          }
          const replyToList = flags.replyTo
            ? flags.replyTo
                .split(",")
                .map((e) => e.trim())
                .filter(Boolean)
            : undefined;
          const payload = {
            ...(flags.name && { name: flags.name }),
            ...(flags.segmentId && { segmentId: flags.segmentId }),
            ...(flags.audience &&
              !flags.segmentId && { audienceId: flags.audience }),
            from: flags.from,
            subject: flags.subject,
            ...(html && { html }),
            ...(flags.text && { text: flags.text }),
            ...(replyToList?.length && {
              replyTo: replyToList.length === 1 ? replyToList[0] : replyToList,
            }),
            ...(flags.previewText && { previewText: flags.previewText }),
            ...(flags.topicId && { topicId: flags.topicId }),
            send: flags.send ?? false,
            ...(flags.send &&
              flags.scheduledAt && { scheduledAt: flags.scheduledAt }),
          };
          const { data, error } = await resend.broadcasts.create(
            payload as Parameters<typeof resend.broadcasts.create>[0],
          );
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Broadcast created! ID: ${data?.id}`));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    send: buildCommand({
      parameters: {
        flags: {
          scheduledAt: {
            kind: "parsed",
            parse: parseString,
            brief: "Schedule send time (ISO 8601 or relative)",
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
            { parse: parseString, brief: "Broadcast ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Send a draft broadcast" },
      func: async (
        flags: { scheduledAt?: string; json?: boolean },
        id: string,
      ) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Sending broadcast ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const payload = flags.scheduledAt
            ? { scheduledAt: flags.scheduledAt }
            : undefined;
          const { data, error } = await resend.broadcasts.send(id, payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Broadcast sent! ID: ${data?.id}`));
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
            brief: "Broadcast name",
            optional: true,
          },
          segmentId: {
            kind: "parsed",
            parse: parseString,
            brief: "Segment ID",
            optional: true,
          },
          from: {
            kind: "parsed",
            parse: parseString,
            brief: "Sender email",
            optional: true,
          },
          subject: {
            kind: "parsed",
            parse: parseString,
            brief: "Subject",
            optional: true,
          },
          html: {
            kind: "parsed",
            parse: parseString,
            brief: "HTML content",
            optional: true,
          },
          text: {
            kind: "parsed",
            parse: parseString,
            brief: "Plain text content",
            optional: true,
          },
          htmlFile: {
            kind: "parsed",
            parse: parseString,
            brief: "Path to HTML file",
            optional: true,
          },
          replyTo: {
            kind: "parsed",
            parse: parseString,
            brief: "Reply-to, comma-separated",
            optional: true,
          },
          previewText: {
            kind: "parsed",
            parse: parseString,
            brief: "Preview text",
            optional: true,
          },
          topicId: {
            kind: "parsed",
            parse: parseString,
            brief: "Topic ID",
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
            { parse: parseString, brief: "Broadcast ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Update a draft broadcast" },
      func: async (
        flags: {
          name?: string;
          segmentId?: string;
          from?: string;
          subject?: string;
          html?: string;
          text?: string;
          htmlFile?: string;
          replyTo?: string;
          previewText?: string;
          topicId?: string;
          json?: boolean;
        },
        id: string,
      ) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Updating broadcast ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          let html = flags.html;
          if (flags.htmlFile) {
            try {
              html = await fs.readFile(flags.htmlFile, "utf-8");
            } catch (err) {
              s.stop(
                formatError(
                  `Failed to read --html-file: ${(err as Error).message}`,
                ),
              );
              return;
            }
          }
          const replyToList = flags.replyTo
            ? flags.replyTo
                .split(",")
                .map((e) => e.trim())
                .filter(Boolean)
            : undefined;
          const payload = {
            ...(flags.name && { name: flags.name }),
            ...(flags.segmentId && { segmentId: flags.segmentId }),
            ...(flags.from && { from: flags.from }),
            ...(flags.subject && { subject: flags.subject }),
            ...(html && { html }),
            ...(flags.text && { text: flags.text }),
            ...(replyToList?.length && { replyTo: replyToList }),
            ...(flags.previewText && { previewText: flags.previewText }),
            ...(flags.topicId !== undefined && {
              topicId: flags.topicId || null,
            }),
          };
          const { data, error } = await resend.broadcasts.update(id, payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Broadcast updated"));
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
            { parse: parseString, brief: "Broadcast ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Remove a broadcast" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Removing broadcast ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.broadcasts.remove(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Broadcast removed"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: "Manage marketing broadcasts" },
});
