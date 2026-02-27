import * as fs from "node:fs/promises";
import * as p from "@clack/prompts";
import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import type {
  CreateEmailOptions,
  ForwardReceivingEmailResponseSuccess,
  GetEmailResponseSuccess,
  GetReceivingEmailResponseSuccess,
  ListAttachmentsResponseSuccess,
  ListReceivingEmailsResponseSuccess,
} from "resend";

/** Emails list item (resend exposes ListEmail internally but does not export it) */
type ListEmailItem = Omit<
  GetEmailResponseSuccess,
  "html" | "text" | "tags" | "object"
>;

/** Attachment list item shape from API (snake_case); SDK may export a different Attachment for send payloads */
type AttachmentListItem = {
  id: string;
  filename?: string;
  size: number;
  content_type: string;
  download_url: string;
  expires_at?: string;
};

import { ResendClient } from "../lib/api.js";
import { stdout } from "../lib/logger.js";
import { createSpinner } from "../lib/ui.js";
import { formatError, formatSuccess, formatTable } from "../lib/output.js";
import { parseLimit, parseString } from "../lib/validators/index.js";

/** In the send handler, split comma-separated lists (e.g. from variadic flags) into email arrays */
function toEmailList(values: string[] | undefined): string[] {
  if (!values?.length) return [];
  return values.flatMap((s) =>
    s
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean),
  );
}

interface SendFlags {
  from?: string;
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  tags?: string;
  scheduledAt?: string;
  topicId?: string;
  headers?: string;
  attach?: string[];
  template?: string;
  templateVariables?: string;
  idempotencyKey?: string;
  json?: boolean;
}

export const emailsRouteMap = buildRouteMap({
  routes: {
    send: buildCommand({
      parameters: {
        flags: {
          from: {
            kind: "parsed",
            parse: parseString,
            brief: "Sender email address",
            optional: true,
          },
          to: {
            kind: "parsed",
            parse: parseString,
            brief: "Recipient(s); comma-separated for multiple",
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
          cc: {
            kind: "parsed",
            parse: parseString,
            brief: "CC address(es); comma-separated or repeat flag",
            optional: true,
            variadic: true,
          },
          bcc: {
            kind: "parsed",
            parse: parseString,
            brief: "BCC address(es); comma-separated or repeat flag",
            optional: true,
            variadic: true,
          },
          replyTo: {
            kind: "parsed",
            parse: parseString,
            brief: "Reply-To address(es); comma-separated or repeat flag",
            optional: true,
            variadic: true,
          },
          tags: {
            kind: "parsed",
            parse: parseString,
            brief: 'Tags as JSON array: [{"name":"key","value":"val"}]',
            optional: true,
          },
          scheduledAt: {
            kind: "parsed",
            parse: parseString,
            brief: "Schedule send time (ISO 8601)",
            optional: true,
          },
          topicId: {
            kind: "parsed",
            parse: parseString,
            brief: "Topic ID for subscription-based sending",
            optional: true,
          },
          headers: {
            kind: "parsed",
            parse: parseString,
            brief: "Custom headers as JSON object",
            optional: true,
          },
          attach: {
            kind: "parsed",
            parse: parseString,
            brief: "Path to file to attach (repeat for multiple)",
            optional: true,
            variadic: true,
          },
          template: {
            kind: "parsed",
            parse: parseString,
            brief: "Template ID (use with template-variables)",
            optional: true,
          },
          templateVariables: {
            kind: "parsed",
            parse: parseString,
            brief: "Template variables as JSON object",
            optional: true,
          },
          idempotencyKey: {
            kind: "parsed",
            parse: parseString,
            brief: "Idempotency key for deduplication",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { f: "from", t: "to", s: "subject", r: "replyTo" },
      },
      docs: {
        brief:
          "Send an email (supports cc, bcc, reply-to, tags, schedule, attachments, template)",
      },
      func: async (flags: SendFlags) => {
        const hasContent = Boolean(flags.html || flags.text);
        const hasTemplate = Boolean(flags.template);
        if (!hasContent && !hasTemplate) {
          stdout(
            formatError(
              "Provide at least one of: --html, --text, or --template",
            ),
          );
          return;
        }
        if (hasContent && hasTemplate) {
          stdout(
            formatError("Use either --html/--text or --template, not both"),
          );
          return;
        }
        if (!flags.from && !hasTemplate) {
          stdout(formatError("--from is required when not using --template"));
          return;
        }
        if (!flags.to) {
          stdout(formatError("--to is required"));
          return;
        }
        if (hasContent && !flags.subject) {
          stdout(formatError("--subject is required when using --html/--text"));
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start("Sending email...");
        try {
          const resend = ResendClient.getInstance();
          const to = flags.to.includes(",")
            ? flags.to.split(",").map((e) => e.trim())
            : flags.to;
          const ccList = toEmailList(flags.cc as string[] | undefined);
          const bccList = toEmailList(flags.bcc as string[] | undefined);
          const replyToList = toEmailList(
            flags.replyTo as string[] | undefined,
          );

          let tags: { name: string; value: string }[] | undefined;
          if (flags.tags) {
            try {
              const parsed = JSON.parse(flags.tags) as unknown;
              tags = Array.isArray(parsed) ? parsed : undefined;
              if (
                tags &&
                !tags.every(
                  (x) =>
                    typeof x?.name === "string" && typeof x?.value === "string",
                )
              ) {
                tags = undefined;
              }
            } catch {
              tags = undefined;
            }
            if (!tags?.length) {
              s.stop(
                formatError(
                  '--tags must be a JSON array of { "name": string, "value": string }',
                ),
              );
              return;
            }
          }

          let headers: Record<string, string> | undefined;
          if (flags.headers) {
            try {
              headers = JSON.parse(flags.headers) as Record<string, string>;
              if (typeof headers !== "object" || headers === null)
                headers = undefined;
            } catch {
              headers = undefined;
            }
            if (!headers || Object.keys(headers).length === 0) {
              s.stop(
                formatError(
                  "--headers must be a JSON object of string key-value pairs",
                ),
              );
              return;
            }
          }

          let attachments:
            | {
                filename?: string;
                content?: Buffer;
                contentType?: string;
                contentId?: string;
              }[]
            | undefined;
          if (flags.attach?.length) {
            attachments = [];
            for (const path of flags.attach) {
              try {
                const content = await fs.readFile(path);
                const filename = path.split(/[/\\]/).pop() ?? "attachment";
                attachments.push({ filename, content });
              } catch (err) {
                s.stop(
                  formatError(
                    `Failed to read attachment ${path}: ${(err as Error).message}`,
                  ),
                );
                return;
              }
            }
          }

          let templateVariables: Record<string, string | number> | undefined;
          if (flags.templateVariables) {
            try {
              templateVariables = JSON.parse(flags.templateVariables) as Record<
                string,
                string | number
              >;
              if (
                typeof templateVariables !== "object" ||
                templateVariables === null
              )
                templateVariables = undefined;
            } catch {
              templateVariables = undefined;
            }
          }

          const payload = hasTemplate
            ? ({
                template: {
                  id: flags.template as string,
                  variables: templateVariables,
                },
                to,
                ...(flags.from && { from: flags.from }),
                ...(flags.subject && { subject: flags.subject }),
                ...(ccList.length && {
                  cc: ccList.length === 1 ? ccList[0] : ccList,
                }),
                ...(bccList.length && {
                  bcc: bccList.length === 1 ? bccList[0] : bccList,
                }),
                ...(replyToList.length && {
                  replyTo:
                    replyToList.length === 1 ? replyToList[0] : replyToList,
                }),
                ...(tags && { tags }),
                ...(flags.scheduledAt && { scheduledAt: flags.scheduledAt }),
                ...(flags.topicId && { topicId: flags.topicId }),
                ...(headers && { headers }),
                ...(attachments?.length && { attachments }),
              } as CreateEmailOptions)
            : ({
                from: flags.from as string,
                to,
                subject: flags.subject as string,
                ...(flags.html && { html: flags.html }),
                ...(flags.text && { text: flags.text }),
                ...(ccList.length && {
                  cc: ccList.length === 1 ? ccList[0] : ccList,
                }),
                ...(bccList.length && {
                  bcc: bccList.length === 1 ? bccList[0] : bccList,
                }),
                ...(replyToList.length && {
                  replyTo:
                    replyToList.length === 1 ? replyToList[0] : replyToList,
                }),
                ...(tags && { tags }),
                ...(flags.scheduledAt && { scheduledAt: flags.scheduledAt }),
                ...(flags.topicId && { topicId: flags.topicId }),
                ...(headers && { headers }),
                ...(attachments?.length && { attachments }),
              } as CreateEmailOptions);

          const sendOptions = flags.idempotencyKey
            ? { idempotencyKey: flags.idempotencyKey }
            : {};
          const { data, error } = await resend.emails.send(
            payload,
            sendOptions,
          );
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Email sent! ID: ${data?.id}`));
          if (flags.json) stdout(JSON.stringify({ data }, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
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
            brief: "Cursor: get items after this email ID",
            optional: true,
          },
          before: {
            kind: "parsed",
            parse: parseString,
            brief: "Cursor: get items before this email ID",
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
      docs: {
        brief:
          "List sent emails (supports pagination: --limit, --after, --before)",
      },
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
        s.start("Fetching emails...");
        try {
          const resend = ResendClient.getInstance();
          const listOptions =
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
          const { data, error } = await resend.emails.list(listOptions);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Emails fetched successfully");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data) {
            const table = formatTable(
              ["ID", "Subject", "Last Event", "Created At"],
              data.data.map((e: ListEmailItem) => [
                e.id,
                e.subject,
                e.last_event,
                new Date(e.created_at).toLocaleString(),
              ]),
            );
            stdout(table);
            if (data.has_more) {
              stdout(
                pc.dim(
                  "(more available; use --after <id> or --before <id> for pagination)",
                ),
              );
            }
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
            { parse: parseString, brief: "Email ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Get email details" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Fetching email ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.emails.get(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Email details fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const email = data as GetEmailResponseSuccess;
          stdout(pc.cyan("\nEmail Details:"));
          stdout(`${pc.bold("ID:")} ${email.id}`);
          stdout(`${pc.bold("Subject:")} ${email.subject}`);
          stdout(`${pc.bold("From:")} ${email.from}`);
          stdout(`${pc.bold("To:")} ${email.to}`);
          stdout(`${pc.bold("Last event:")} ${email.last_event}`);
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    update: buildCommand({
      parameters: {
        flags: {
          scheduledAt: {
            kind: "parsed",
            parse: parseString,
            brief:
              "New scheduled time (ISO 8601, e.g. 2024-08-05T11:52:01.858Z)",
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { s: "scheduledAt" },
        positional: {
          kind: "tuple",
          parameters: [
            { parse: parseString, brief: "Email ID", placeholder: "id" },
          ],
        },
      },
      docs: {
        brief: "Reschedule a scheduled email (update scheduled send time)",
      },
      func: async (
        flags: { scheduledAt: string; json?: boolean },
        id: string,
      ) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Updating scheduled email ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.emails.update({
            id,
            scheduledAt: flags.scheduledAt,
          });
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(
            formatSuccess(
              `Email ${data?.id} rescheduled to ${flags.scheduledAt}`,
            ),
          );
          if (flags.json) stdout(JSON.stringify({ data }, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    cancel: buildCommand({
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
              brief: "Email ID (scheduled email to cancel)",
              placeholder: "id",
            },
          ],
        },
      },
      docs: { brief: "Cancel a scheduled email (not yet sent)" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Cancelling scheduled email ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.emails.cancel(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Email ${data?.id} cancelled`));
          if (flags.json) stdout(JSON.stringify({ data }, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    batch: buildCommand({
      parameters: {
        flags: {
          file: {
            kind: "parsed",
            parse: parseString,
            brief: "Path to JSON file with array of email payloads",
            optional: true,
          },
          validation: {
            kind: "parsed",
            parse: parseString,
            brief: "strict or permissive",
            optional: true,
          },
          idempotencyKey: {
            kind: "parsed",
            parse: parseString,
            brief: "Idempotency key for the batch",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { f: "file", v: "validation" },
      },
      docs: {
        brief:
          "Send a batch of emails from JSON file or stdin (array of send payloads)",
      },
      func: async (flags: {
        file?: string;
        validation?: string;
        idempotencyKey?: string;
        json?: boolean;
      }) => {
        let raw: string;
        if (flags.file) {
          try {
            raw = await fs.readFile(flags.file, "utf-8");
          } catch (e) {
            stdout(
              formatError(`Failed to read --file: ${(e as Error).message}`),
            );
            return;
          }
        } else {
          const chunks: Buffer[] = [];
          for await (const chunk of process.stdin) chunks.push(chunk);
          raw = Buffer.concat(chunks).toString("utf-8");
        }
        let payload: CreateEmailOptions[];
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (!Array.isArray(parsed)) {
            stdout(
              formatError(
                "JSON must be an array of email objects (to, from, subject, html/text/template)",
              ),
            );
            return;
          }
          payload = parsed as CreateEmailOptions[];
        } catch (e) {
          stdout(formatError(`Invalid JSON: ${(e as Error).message}`));
          return;
        }
        if (!payload.length) {
          stdout(formatError("Batch array is empty"));
          return;
        }
        const validation =
          flags.validation === "permissive" ? "permissive" : "strict";
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Sending batch of ${payload.length} emails...`);
        try {
          const resend = ResendClient.getInstance();
          const opts: {
            batchValidation?: "strict" | "permissive";
            idempotencyKey?: string;
          } = {
            batchValidation: validation,
          };
          if (flags.idempotencyKey) opts.idempotencyKey = flags.idempotencyKey;
          const { data, error } = await resend.batch.send(payload, opts);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(
            formatSuccess(`Batch sent: ${data?.data?.length ?? 0} emails`),
          );
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
          } else if (data?.data?.length) {
            const table = formatTable(
              ["Index", "Email ID"],
              data.data.map((row, i) => [String(i), row.id]),
            );
            stdout(table);
            const dataWithErrors = data as typeof data & {
              errors?: { index: number; message: string }[];
            };
            if (
              dataWithErrors?.errors &&
              Array.isArray(dataWithErrors.errors)
            ) {
              const errs = dataWithErrors.errors;
              if (errs.length) {
                stdout(pc.yellow("\nPartial failures (permissive mode):"));
                for (const e of errs) stdout(`  [${e.index}] ${e.message}`);
              }
            }
          }
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    attachments: buildRouteMap({
      routes: {
        list: buildCommand({
          parameters: {
            flags: {
              limit: {
                kind: "parsed",
                parse: parseLimit,
                brief: "Max items (1-100)",
                optional: true,
              },
              after: {
                kind: "parsed",
                parse: parseString,
                brief: "Cursor after ID",
                optional: true,
              },
              before: {
                kind: "parsed",
                parse: parseString,
                brief: "Cursor before ID",
                optional: true,
              },
              json: {
                kind: "boolean",
                brief: "Output as JSON",
                optional: true,
              },
            },
            positional: {
              kind: "tuple",
              parameters: [
                {
                  parse: parseString,
                  brief: "Sent email ID",
                  placeholder: "emailId",
                },
              ],
            },
          },
          docs: { brief: "List attachments for a sent email" },
          func: async (
            flags: {
              limit?: number;
              after?: string;
              before?: string;
              json?: boolean;
            },
            emailId: string,
          ) => {
            if (flags.after != null && flags.before != null) {
              stdout(formatError("Use only one of --after or --before"));
              return;
            }
            const s = createSpinner({ enabled: !flags.json });
            s.start("Fetching attachments...");
            try {
              const resend = ResendClient.getInstance();
              const opts =
                flags.after != null
                  ? {
                      emailId,
                      ...(flags.limit != null && { limit: flags.limit }),
                      after: flags.after,
                    }
                  : flags.before != null
                    ? {
                        emailId,
                        ...(flags.limit != null && { limit: flags.limit }),
                        before: flags.before,
                      }
                    : {
                        emailId,
                        ...(flags.limit != null && { limit: flags.limit }),
                      };
              const { data, error } =
                await resend.emails.attachments.list(opts);
              if (error) {
                s.stop(formatError(error.message));
                if (flags.json) stdout(JSON.stringify({ error }, null, 2));
                return;
              }
              s.stop("Attachments fetched");
              if (flags.json) {
                stdout(JSON.stringify(data, null, 2));
                return;
              }
              const list = (data as ListAttachmentsResponseSuccess)?.data as
                | AttachmentListItem[]
                | undefined;
              if (list?.length) {
                const table = formatTable(
                  ["ID", "Filename", "Size", "Content-Type", "Download URL"],
                  list.map((a) => [
                    a.id,
                    a.filename ?? "-",
                    String(a.size),
                    a.content_type,
                    a.download_url ?? "-",
                  ]),
                );
                stdout(table);
              } else {
                stdout(pc.yellow("No attachments"));
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
                brief: "Output as JSON",
                optional: true,
              },
            },
            positional: {
              kind: "tuple",
              parameters: [
                {
                  parse: parseString,
                  brief: "Sent email ID",
                  placeholder: "emailId",
                },
                {
                  parse: parseString,
                  brief: "Attachment ID",
                  placeholder: "attachmentId",
                },
              ],
            },
          },
          docs: {
            brief: "Get attachment metadata and download URL (sent email)",
          },
          func: async (
            flags: { json?: boolean },
            emailId: string,
            attachmentId: string,
          ) => {
            const s = createSpinner({ enabled: !flags.json });
            s.start("Fetching attachment...");
            try {
              const resend = ResendClient.getInstance();
              const { data, error } = await resend.emails.attachments.get({
                emailId,
                id: attachmentId,
              });
              if (error) {
                s.stop(formatError(error.message));
                if (flags.json) stdout(JSON.stringify({ error }, null, 2));
                return;
              }
              s.stop("Attachment fetched");
              if (flags.json) {
                stdout(JSON.stringify(data, null, 2));
                return;
              }
              const a = data as unknown as AttachmentListItem;
              stdout(pc.cyan("\nAttachment:"));
              stdout(`${pc.bold("ID:")} ${a.id}`);
              stdout(`${pc.bold("Filename:")} ${a.filename ?? "-"}`);
              stdout(`${pc.bold("Size:")} ${a.size}`);
              stdout(`${pc.bold("Content-Type:")} ${a.content_type}`);
              stdout(`${pc.bold("Download URL:")} ${a.download_url ?? "-"}`);
              stdout(`${pc.bold("Expires:")} ${a.expires_at ?? "-"}`);
            } catch (err: unknown) {
              s.stop(formatError((err as Error).message));
              throw err;
            }
          },
        }),
      },
      docs: {
        brief: "List/get attachments for sent emails (metadata + URL only)",
      },
    }),
    receiving: buildRouteMap({
      routes: {
        list: buildCommand({
          parameters: {
            flags: {
              limit: {
                kind: "parsed",
                parse: parseLimit,
                brief: "Max items (1-100)",
                optional: true,
              },
              after: {
                kind: "parsed",
                parse: parseString,
                brief: "Cursor after ID",
                optional: true,
              },
              before: {
                kind: "parsed",
                parse: parseString,
                brief: "Cursor before ID",
                optional: true,
              },
              json: {
                kind: "boolean",
                brief: "Output as JSON",
                optional: true,
              },
            },
          },
          docs: { brief: "List received/inbound emails" },
          func: async (flags: {
            limit?: number;
            after?: string;
            before?: string;
            json?: boolean;
          }) => {
            if (flags.after != null && flags.before != null) {
              stdout(formatError("Use only one of --after or --before"));
              return;
            }
            const s = createSpinner({ enabled: !flags.json });
            s.start("Fetching receiving emails...");
            try {
              const resend = ResendClient.getInstance();
              const opts =
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
              const { data, error } = await resend.emails.receiving.list(opts);
              if (error) {
                s.stop(formatError(error.message));
                if (flags.json) stdout(JSON.stringify({ error }, null, 2));
                return;
              }
              s.stop("Receiving emails fetched");
              if (flags.json) {
                stdout(JSON.stringify(data, null, 2));
                return;
              }
              const list = (data as ListReceivingEmailsResponseSuccess)?.data;
              if (list?.length) {
                const table = formatTable(
                  ["ID", "Subject", "From", "Created"],
                  list.map((e) => [
                    e.id,
                    e.subject ?? "-",
                    e.from,
                    new Date(e.created_at).toLocaleString(),
                  ]),
                );
                stdout(table);
              } else {
                stdout(pc.yellow("No receiving emails"));
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
                brief: "Output as JSON",
                optional: true,
              },
            },
            positional: {
              kind: "tuple",
              parameters: [
                {
                  parse: parseString,
                  brief: "Receiving email ID",
                  placeholder: "id",
                },
              ],
            },
          },
          docs: { brief: "Get a received/inbound email" },
          func: async (flags: { json?: boolean }, id: string) => {
            const s = createSpinner({ enabled: !flags.json });
            s.start(`Fetching receiving email ${id}...`);
            try {
              const resend = ResendClient.getInstance();
              const { data, error } = await resend.emails.receiving.get(id);
              if (error) {
                s.stop(formatError(error.message));
                if (flags.json) stdout(JSON.stringify({ error }, null, 2));
                return;
              }
              s.stop("Receiving email fetched");
              if (flags.json) {
                stdout(JSON.stringify(data, null, 2));
                return;
              }
              const e = data as GetReceivingEmailResponseSuccess;
              stdout(pc.cyan("\nReceiving email:"));
              stdout(`${pc.bold("ID:")} ${e.id}`);
              stdout(`${pc.bold("Subject:")} ${e.subject}`);
              stdout(`${pc.bold("From:")} ${e.from}`);
              stdout(`${pc.bold("To:")} ${e.to?.join(", ") ?? "-"}`);
              stdout(`${pc.bold("Created:")} ${e.created_at}`);
              if (e.raw?.download_url)
                stdout(`${pc.bold("Raw download URL:")} ${e.raw.download_url}`);
            } catch (err: unknown) {
              s.stop(formatError((err as Error).message));
              throw err;
            }
          },
        }),
        forward: buildCommand({
          parameters: {
            flags: {
              emailId: {
                kind: "parsed",
                parse: parseString,
                brief: "Receiving email ID to forward",
                optional: true,
              },
              to: {
                kind: "parsed",
                parse: parseString,
                brief: "Recipient(s); comma-separated",
                optional: true,
              },
              from: {
                kind: "parsed",
                parse: parseString,
                brief: "Sender address",
                optional: true,
              },
              passthrough: {
                kind: "boolean",
                brief: "Forward as-is (default true)",
                optional: true,
              },
              text: {
                kind: "parsed",
                parse: parseString,
                brief: "Custom text body (if passthrough false)",
                optional: true,
              },
              html: {
                kind: "parsed",
                parse: parseString,
                brief: "Custom HTML body (if passthrough false)",
                optional: true,
              },
              json: {
                kind: "boolean",
                brief: "Output as JSON",
                optional: true,
              },
            },
          },
          docs: {
            brief: "Forward a received email (emailId, to, from required)",
          },
          func: async (flags: {
            emailId?: string;
            to?: string;
            from?: string;
            passthrough?: boolean;
            text?: string;
            html?: string;
            json?: boolean;
          }) => {
            if (!flags.emailId || !flags.to || !flags.from) {
              stdout(formatError("--email-id, --to, and --from are required"));
              return;
            }
            if (flags.passthrough === false && !flags.text && !flags.html) {
              stdout(
                formatError(
                  "When --passthrough is false, provide --text and/or --html",
                ),
              );
              return;
            }
            const s = createSpinner({ enabled: !flags.json });
            s.start("Forwarding email...");
            try {
              const resend = ResendClient.getInstance();
              const to = flags.to.includes(",")
                ? flags.to.split(",").map((x) => x.trim())
                : flags.to;
              const base = { emailId: flags.emailId, to, from: flags.from };
              const opts =
                flags.passthrough === false
                  ? ({
                      ...base,
                      passthrough: false,
                      text: flags.text ?? "",
                      html: flags.html,
                    } as import("resend").ForwardReceivingEmailOptions)
                  : base;
              const { data, error } =
                await resend.emails.receiving.forward(opts);
              if (error) {
                s.stop(formatError(error.message));
                if (flags.json) stdout(JSON.stringify({ error }, null, 2));
                return;
              }
              s.stop(
                formatSuccess(
                  `Forwarded! New email ID: ${(data as ForwardReceivingEmailResponseSuccess)?.id}`,
                ),
              );
              if (flags.json) stdout(JSON.stringify(data, null, 2));
            } catch (err: unknown) {
              s.stop(formatError((err as Error).message));
              throw err;
            }
          },
        }),
        attachments: buildRouteMap({
          routes: {
            list: buildCommand({
              parameters: {
                flags: {
                  limit: {
                    kind: "parsed",
                    parse: parseLimit,
                    brief: "Max items (1-100)",
                    optional: true,
                  },
                  after: {
                    kind: "parsed",
                    parse: parseString,
                    brief: "Cursor after ID",
                    optional: true,
                  },
                  before: {
                    kind: "parsed",
                    parse: parseString,
                    brief: "Cursor before ID",
                    optional: true,
                  },
                  json: {
                    kind: "boolean",
                    brief: "Output as JSON",
                    optional: true,
                  },
                },
                positional: {
                  kind: "tuple",
                  parameters: [
                    {
                      parse: parseString,
                      brief: "Receiving email ID",
                      placeholder: "emailId",
                    },
                  ],
                },
              },
              docs: { brief: "List attachments for a received email" },
              func: async (
                flags: {
                  limit?: number;
                  after?: string;
                  before?: string;
                  json?: boolean;
                },
                emailId: string,
              ) => {
                if (flags.after != null && flags.before != null) {
                  stdout(formatError("Use only one of --after or --before"));
                  return;
                }
                const s = createSpinner({ enabled: !flags.json });
                s.start("Fetching attachments...");
                try {
                  const resend = ResendClient.getInstance();
                  const opts =
                    flags.after != null
                      ? {
                          emailId,
                          ...(flags.limit != null && { limit: flags.limit }),
                          after: flags.after,
                        }
                      : flags.before != null
                        ? {
                            emailId,
                            ...(flags.limit != null && { limit: flags.limit }),
                            before: flags.before,
                          }
                        : {
                            emailId,
                            ...(flags.limit != null && { limit: flags.limit }),
                          };
                  const { data, error } =
                    await resend.emails.receiving.attachments.list(opts);
                  if (error) {
                    s.stop(formatError(error.message));
                    if (flags.json) stdout(JSON.stringify({ error }, null, 2));
                    return;
                  }
                  s.stop("Attachments fetched");
                  if (flags.json) {
                    stdout(JSON.stringify(data, null, 2));
                    return;
                  }
                  const list = (data as ListAttachmentsResponseSuccess)?.data as
                    | AttachmentListItem[]
                    | undefined;
                  if (list?.length) {
                    const table = formatTable(
                      ["ID", "Filename", "Size", "Content-Type"],
                      list.map((a) => [
                        a.id,
                        a.filename ?? "-",
                        String(a.size),
                        a.content_type,
                      ]),
                    );
                    stdout(table);
                  } else {
                    stdout(pc.yellow("No attachments"));
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
                    brief: "Output as JSON",
                    optional: true,
                  },
                },
                positional: {
                  kind: "tuple",
                  parameters: [
                    {
                      parse: parseString,
                      brief: "Receiving email ID",
                      placeholder: "emailId",
                    },
                    {
                      parse: parseString,
                      brief: "Attachment ID",
                      placeholder: "attachmentId",
                    },
                  ],
                },
              },
              docs: {
                brief:
                  "Get attachment metadata and download URL (received email)",
              },
              func: async (
                flags: { json?: boolean },
                emailId: string,
                attachmentId: string,
              ) => {
                const s = createSpinner({ enabled: !flags.json });
                s.start("Fetching attachment...");
                try {
                  const resend = ResendClient.getInstance();
                  const { data, error } =
                    await resend.emails.receiving.attachments.get({
                      emailId,
                      id: attachmentId,
                    });
                  if (error) {
                    s.stop(formatError(error.message));
                    if (flags.json) stdout(JSON.stringify({ error }, null, 2));
                    return;
                  }
                  s.stop("Attachment fetched");
                  if (flags.json) {
                    stdout(JSON.stringify(data, null, 2));
                    return;
                  }
                  const a = data as unknown as AttachmentListItem;
                  stdout(pc.cyan("\nAttachment:"));
                  stdout(`${pc.bold("ID:")} ${a.id}`);
                  stdout(`${pc.bold("Filename:")} ${a.filename ?? "-"}`);
                  stdout(`${pc.bold("Size:")} ${a.size}`);
                  stdout(`${pc.bold("Content-Type:")} ${a.content_type}`);
                  if (a.download_url)
                    stdout(`${pc.bold("Download URL:")} ${a.download_url}`);
                  if (a.expires_at)
                    stdout(`${pc.bold("Expires:")} ${a.expires_at}`);
                } catch (err: unknown) {
                  s.stop(formatError((err as Error).message));
                  throw err;
                }
              },
            }),
          },
          docs: {
            brief:
              "List/get attachments for received emails (metadata + URL only)",
          },
        }),
      },
      docs: { brief: "List/get/forward received (inbound) emails" },
    }),
  },
  docs: { brief: "Manage and send transactional emails" },
});
