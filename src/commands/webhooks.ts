import * as p from "@clack/prompts";
import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import type {
  CreateWebhookOptions,
  GetWebhookResponseSuccess,
  UpdateWebhookOptions,
  Webhook,
  WebhookEvent,
} from "resend";
import { ResendClient } from "../lib/api.js";
import { stdout } from "../lib/logger.js";
import { formatError, formatSuccess, formatTable } from "../lib/output.js";
import { createSpinner } from "../lib/ui.js";
import { parseLimit, parseString } from "../lib/validators/index.js";

const WEBHOOK_EVENTS =
  "email.sent, email.scheduled, email.delivered, email.delivery_delayed, email.complained, email.bounced, email.opened, email.clicked, email.received, email.failed, email.suppressed, contact.created, contact.updated, contact.deleted, domain.created, domain.updated, domain.deleted";

export const webhooksRouteMap = buildRouteMap({
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
      docs: { brief: "List all webhooks (supports pagination)" },
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
        s.start("Fetching webhooks...");
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
          const { data, error } = await resend.webhooks.list(listParams);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Webhooks fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data?.length) {
            const table = formatTable(
              ["ID", "Endpoint", "Status", "Created At"],
              data.data.map((w: Webhook) => [
                w.id,
                w.endpoint.length > 50
                  ? `${w.endpoint.substring(0, 50)}...`
                  : w.endpoint,
                w.status,
                new Date(w.created_at).toLocaleString(),
              ]),
            );
            stdout(table);
          } else {
            stdout(pc.yellow("No webhooks found"));
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
            { parse: parseString, brief: "Webhook ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Get webhook details" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Fetching webhook ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.webhooks.get(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Webhook details fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const webhook = data as GetWebhookResponseSuccess;
          stdout(pc.cyan("\nWebhook Details:"));
          stdout(`${pc.bold("ID:")} ${webhook.id}`);
          stdout(`${pc.bold("Endpoint:")} ${webhook.endpoint}`);
          stdout(`${pc.bold("Status:")} ${webhook.status}`);
          stdout(
            `${pc.bold("Events:")} ${webhook.events?.join(", ") ?? "all"}`,
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
          url: {
            kind: "parsed",
            parse: parseString,
            brief: "Webhook endpoint URL",
            optional: true,
          },
          endpoint: {
            kind: "parsed",
            parse: parseString,
            brief: "Webhook endpoint URL (same as --url)",
            optional: true,
          },
          events: {
            kind: "parsed",
            parse: parseString,
            brief: `Event types (variadic). Valid: ${WEBHOOK_EVENTS}`,
            optional: true,
            variadic: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { u: "url", e: "events" },
      },
      docs: {
        brief:
          "Create a new webhook (--url/--endpoint required; --events optional)",
      },
      func: async (flags: {
        url?: string;
        endpoint?: string;
        events?: string[];
        json?: boolean;
      }) => {
        const endpoint = flags.url ?? flags.endpoint;
        if (!endpoint) {
          stdout(
            formatError("Provide --url or --endpoint (webhook endpoint URL)."),
          );
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start("Creating webhook...");
        try {
          const resend = ResendClient.getInstance();
          const createPayload: CreateWebhookOptions = {
            endpoint,
            events: (flags.events ?? []) as WebhookEvent[],
          };
          const { data, error } = await resend.webhooks.create(createPayload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Webhook created! ID: ${data?.id}`));
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
          endpoint: {
            kind: "parsed",
            parse: parseString,
            brief: "New webhook endpoint URL",
            optional: true,
          },
          status: {
            kind: "parsed",
            parse: parseString,
            brief: "Status: enabled or disabled",
            optional: true,
          },
          events: {
            kind: "parsed",
            parse: parseString,
            brief: "Event types to listen for",
            optional: true,
            variadic: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { e: "events" },
        positional: {
          kind: "tuple",
          parameters: [
            { parse: parseString, brief: "Webhook ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Update a webhook (endpoint, status, or events)" },
      func: async (
        flags: {
          endpoint?: string;
          status?: string;
          events?: string[];
          json?: boolean;
        },
        id: string,
      ) => {
        if (
          !flags.endpoint &&
          flags.status === undefined &&
          !flags.events?.length
        ) {
          stdout(
            formatError(
              "Provide at least one of: --endpoint, --status (enabled/disabled), or --events.",
            ),
          );
          return;
        }
        if (flags.status && !["enabled", "disabled"].includes(flags.status)) {
          stdout(formatError('--status must be "enabled" or "disabled".'));
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Updating webhook ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const updatePayload: UpdateWebhookOptions = {
            ...(flags.endpoint && { endpoint: flags.endpoint }),
            ...(flags.status && {
              status: flags.status as "enabled" | "disabled",
            }),
            ...(flags.events?.length && {
              events: flags.events as WebhookEvent[],
            }),
          };
          const { data, error } = await resend.webhooks.update(
            id,
            updatePayload,
          );
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Webhook updated!"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
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
            { parse: parseString, brief: "Webhook ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Delete a webhook" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Deleting webhook ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.webhooks.remove(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Webhook deleted!"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: "Manage webhooks for email events" },
});
