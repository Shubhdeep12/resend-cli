import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import type { Contact, CreateContactOptions } from "resend";
import { ResendClient } from "../lib/api.js";
import { CliError } from "../lib/errors.js";
import { stdout } from "../lib/logger.js";
import { formatError, formatSuccess, formatTable } from "../lib/output.js";
import { createSpinner } from "../lib/ui.js";
import { parseLimit, parseString } from "../lib/validators/index.js";

export const contactsRouteMap = buildRouteMap({
  routes: {
    list: buildCommand({
      parameters: {
        flags: {
          segmentId: {
            kind: "parsed",
            parse: parseString,
            brief: "Segment ID to list contacts in",
            optional: true,
          },
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
        aliases: { s: "segmentId", l: "limit" },
      },
      docs: {
        brief: "List contacts (optionally in a segment); supports pagination",
      },
      func: async (flags: {
        segmentId?: string;
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
        s.start("Fetching contacts...");
        try {
          const resend = ResendClient.getInstance();
          const listParams =
            flags.after != null
              ? {
                  ...(flags.segmentId && { segmentId: flags.segmentId }),
                  ...(flags.limit != null && { limit: flags.limit }),
                  after: flags.after,
                }
              : flags.before != null
                ? {
                    ...(flags.segmentId && { segmentId: flags.segmentId }),
                    ...(flags.limit != null && { limit: flags.limit }),
                    before: flags.before,
                  }
                : {
                    ...(flags.segmentId && { segmentId: flags.segmentId }),
                    ...(flags.limit != null && { limit: flags.limit }),
                  };
          const { data, error } = await resend.contacts.list(listParams);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Contacts fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data) {
            const table = formatTable(
              ["ID", "Email", "First Name", "Last Name", "Created At"],
              data.data.map((c: Contact) => [
                c.id,
                c.email,
                c.first_name ?? "-",
                c.last_name ?? "-",
                new Date(c.created_at).toLocaleString(),
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
          id: {
            kind: "parsed",
            parse: parseString,
            brief: "Contact ID",
            optional: true,
          },
          email: {
            kind: "parsed",
            parse: parseString,
            brief: "Contact email",
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
              brief: "Contact ID or email",
              placeholder: "id-or-email",
              optional: true,
            },
          ],
        },
      },
      docs: { brief: "Get a contact by ID or email" },
      func: async (
        flags: { id?: string; email?: string; json?: boolean },
        positional?: string,
      ) => {
        const identifier = flags.id ?? flags.email ?? positional;
        if (!identifier) {
          stdout(
            formatError(
              "Provide contact ID or email (positional, or --id / --email).",
            ),
          );
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Fetching contact ${identifier}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.contacts.get(identifier);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Contact fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const c = data as Contact;
          stdout(pc.cyan("\nContact:"));
          stdout(`${pc.bold("ID:")} ${c.id}`);
          stdout(`${pc.bold("Email:")} ${c.email}`);
          stdout(`${pc.bold("First name:")} ${c.first_name ?? "-"}`);
          stdout(`${pc.bold("Last name:")} ${c.last_name ?? "-"}`);
          stdout(`${pc.bold("Unsubscribed:")} ${c.unsubscribed}`);
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    create: buildCommand({
      parameters: {
        flags: {
          email: { kind: "parsed", parse: parseString, brief: "Contact email" },
          firstName: {
            kind: "parsed",
            parse: parseString,
            brief: "First name",
            optional: true,
          },
          lastName: {
            kind: "parsed",
            parse: parseString,
            brief: "Last name",
            optional: true,
          },
          unsubscribed: {
            kind: "boolean",
            brief: "Mark as unsubscribed",
            optional: true,
          },
          properties: {
            kind: "parsed",
            parse: parseString,
            brief: 'Custom properties JSON e.g. {"key":"value"}',
            optional: true,
          },
          segments: {
            kind: "parsed",
            parse: parseString,
            brief: 'Segment IDs JSON array e.g. ["seg_xxx"]',
            optional: true,
          },
          topics: {
            kind: "parsed",
            parse: parseString,
            brief:
              'Topics JSON array e.g. [{"id":"topic_xxx","subscription":"opt_in"}]',
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { e: "email", f: "firstName", l: "lastName" },
      },
      docs: { brief: "Create a contact (use --segments to add to segments)" },
      func: async (flags: {
        email: string;
        firstName?: string;
        lastName?: string;
        unsubscribed?: boolean;
        properties?: string;
        segments?: string;
        topics?: string;
        json?: boolean;
      }) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Adding contact ${flags.email}...`);
        try {
          const resend = ResendClient.getInstance();
          let segments: { id: string }[] | undefined;
          if (flags.segments) {
            try {
              segments = JSON.parse(flags.segments) as { id: string }[];
              if (!Array.isArray(segments)) segments = undefined;
            } catch {
              s.stop(
                formatError(
                  '--segments must be a JSON array of segment IDs e.g. ["seg_xxx"]',
                ),
              );
              return;
            }
          }
          let topics:
            | { id: string; subscription: "opt_in" | "opt_out" }[]
            | undefined;
          if (flags.topics) {
            try {
              topics = JSON.parse(flags.topics) as {
                id: string;
                subscription: "opt_in" | "opt_out";
              }[];
              if (!Array.isArray(topics)) topics = undefined;
            } catch {
              s.stop(
                formatError(
                  '--topics must be a JSON array e.g. [{"id":"topic_xxx","subscription":"opt_in"}]',
                ),
              );
              return;
            }
          }
          let properties: Record<string, string | number | null> | undefined;
          if (flags.properties) {
            try {
              properties = JSON.parse(flags.properties) as Record<
                string,
                string | number | null
              >;
            } catch {
              s.stop(formatError("--properties must be valid JSON"));
              return;
            }
          }
          const payload: CreateContactOptions = {
            email: flags.email,
            ...(flags.firstName && { firstName: flags.firstName }),
            ...(flags.lastName && { lastName: flags.lastName }),
            ...(flags.unsubscribed !== undefined && {
              unsubscribed: flags.unsubscribed,
            }),
            ...(properties && { properties }),
            ...(segments?.length && { segments }),
            ...(topics?.length && { topics }),
          };
          const { data, error } = await resend.contacts.create(payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Contact added! ID: ${data?.id}`));
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
          id: {
            kind: "parsed",
            parse: parseString,
            brief: "Contact ID",
            optional: true,
          },
          email: {
            kind: "parsed",
            parse: parseString,
            brief: "Contact email",
            optional: true,
          },
          firstName: {
            kind: "parsed",
            parse: parseString,
            brief: "First name",
            optional: true,
          },
          lastName: {
            kind: "parsed",
            parse: parseString,
            brief: "Last name",
            optional: true,
          },
          unsubscribed: {
            kind: "boolean",
            brief: "Unsubscribed",
            optional: true,
          },
          properties: {
            kind: "parsed",
            parse: parseString,
            brief: "Properties JSON",
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
              brief: "Contact ID or email",
              placeholder: "id-or-email",
              optional: true,
            },
          ],
        },
      },
      docs: { brief: "Update a contact" },
      func: async (
        flags: {
          id?: string;
          email?: string;
          firstName?: string;
          lastName?: string;
          unsubscribed?: boolean;
          properties?: string;
          json?: boolean;
        },
        positional?: string,
      ) => {
        const identifier = flags.id ?? flags.email ?? positional;
        if (!identifier) {
          stdout(
            formatError(
              "Provide contact ID or email (positional, or --id / --email).",
            ),
          );
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Updating contact ${identifier}...`);
        try {
          const resend = ResendClient.getInstance();
          let properties: Record<string, string | number | null> | undefined;
          if (flags.properties) {
            try {
              properties = JSON.parse(flags.properties) as Record<
                string,
                string | number | null
              >;
            } catch {
              s.stop(formatError("--properties must be valid JSON"));
              return;
            }
          }
          const payload = identifier.includes("@")
            ? {
                email: identifier,
                ...(flags.firstName !== undefined && {
                  firstName: flags.firstName,
                }),
                ...(flags.lastName !== undefined && {
                  lastName: flags.lastName,
                }),
                ...(flags.unsubscribed !== undefined && {
                  unsubscribed: flags.unsubscribed,
                }),
                ...(properties && { properties }),
              }
            : {
                id: identifier,
                ...(flags.firstName !== undefined && {
                  firstName: flags.firstName,
                }),
                ...(flags.lastName !== undefined && {
                  lastName: flags.lastName,
                }),
                ...(flags.unsubscribed !== undefined && {
                  unsubscribed: flags.unsubscribed,
                }),
                ...(properties && { properties }),
              };
          const { data, error } = await resend.contacts.update(payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Contact updated"));
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
              brief: "Contact ID or email",
              placeholder: "id-or-email",
            },
          ],
        },
      },
      docs: { brief: "Remove a contact" },
      func: async (flags: { json?: boolean }, idOrEmail: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Removing contact ${idOrEmail}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.contacts.remove(idOrEmail);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Contact removed"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    segments: buildRouteMap({
      routes: {
        add: buildCommand({
          parameters: {
            flags: {
              contactId: {
                kind: "parsed",
                parse: parseString,
                brief: "Contact ID",
                optional: true,
              },
              email: {
                kind: "parsed",
                parse: parseString,
                brief: "Contact email",
                optional: true,
              },
              segmentId: {
                kind: "parsed",
                parse: parseString,
                brief: "Segment ID to add contact to",
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
                  brief: "Contact ID or email",
                  placeholder: "id-or-email",
                  optional: true,
                },
                {
                  parse: parseString,
                  brief: "Segment ID",
                  placeholder: "segment-id",
                  optional: true,
                },
              ],
            },
          },
          docs: { brief: "Add a contact to a segment" },
          func: async (
            flags: {
              contactId?: string;
              email?: string;
              segmentId?: string;
              json?: boolean;
            },
            pos1?: string,
            pos2?: string,
          ) => {
            const identifier = flags.contactId ?? flags.email ?? pos1;
            const segmentId = flags.segmentId ?? pos2;
            if (!identifier || !segmentId) {
              stdout(
                formatError("Provide contact (ID or email) and segment ID."),
              );
              return;
            }
            const s = createSpinner({ enabled: !flags.json });
            s.start(`Adding contact to segment ${segmentId}...`);
            try {
              const resend = ResendClient.getInstance();
              const opts = identifier.includes("@")
                ? { email: identifier, segmentId }
                : { contactId: identifier, segmentId };
              const { data, error } = await resend.contacts.segments.add(opts);
              if (error) {
                s.stop(formatError(error.message));
                if (flags.json) stdout(JSON.stringify({ error }, null, 2));
                return;
              }
              s.stop(formatSuccess("Contact added to segment"));
              if (flags.json) stdout(JSON.stringify(data, null, 2));
            } catch (err: unknown) {
              s.stop(formatError((err as Error).message));
              throw err;
            }
          },
        }),
        list: buildCommand({
          parameters: {
            flags: {
              contactId: {
                kind: "parsed",
                parse: parseString,
                brief: "Contact ID",
                optional: true,
              },
              email: {
                kind: "parsed",
                parse: parseString,
                brief: "Contact email",
                optional: true,
              },
              limit: {
                kind: "parsed",
                parse: parseLimit,
                brief: "Max items (1-100)",
                optional: true,
              },
              after: {
                kind: "parsed",
                parse: parseString,
                brief: "Cursor after",
                optional: true,
              },
              before: {
                kind: "parsed",
                parse: parseString,
                brief: "Cursor before",
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
                  brief: "Contact ID or email",
                  placeholder: "id-or-email",
                  optional: true,
                },
              ],
            },
          },
          docs: { brief: "List segments for a contact" },
          func: async (
            flags: {
              contactId?: string;
              email?: string;
              limit?: number;
              after?: string;
              before?: string;
              json?: boolean;
            },
            positional?: string,
          ) => {
            const identifier = flags.contactId ?? flags.email ?? positional;
            if (!identifier) {
              stdout(formatError("Provide contact ID or email."));
              return;
            }
            if (flags.after != null && flags.before != null) {
              stdout(formatError("Cannot use both --after and --before."));
              return;
            }
            const s = createSpinner({ enabled: !flags.json });
            s.start("Fetching contact segments...");
            try {
              const resend = ResendClient.getInstance();
              const pagination =
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
              const opts = identifier.includes("@")
                ? { email: identifier, ...pagination }
                : { contactId: identifier, ...pagination };
              const { data, error } = await resend.contacts.segments.list(opts);
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
                  data.data.map((seg: { id: string; name?: string }) => [
                    seg.id,
                    seg.name ?? "-",
                  ]),
                );
                stdout(table);
              } else {
                stdout("No segments for this contact.");
              }
            } catch (err: unknown) {
              s.stop(formatError((err as Error).message));
              throw err;
            }
          },
        }),
        remove: buildCommand({
          parameters: {
            flags: {
              contactId: {
                kind: "parsed",
                parse: parseString,
                brief: "Contact ID",
                optional: true,
              },
              email: {
                kind: "parsed",
                parse: parseString,
                brief: "Contact email",
                optional: true,
              },
              segmentId: {
                kind: "parsed",
                parse: parseString,
                brief: "Segment ID to remove from",
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
                  brief: "Contact ID or email",
                  placeholder: "id-or-email",
                  optional: true,
                },
                {
                  parse: parseString,
                  brief: "Segment ID",
                  placeholder: "segment-id",
                  optional: true,
                },
              ],
            },
          },
          docs: { brief: "Remove a contact from a segment" },
          func: async (
            flags: {
              contactId?: string;
              email?: string;
              segmentId?: string;
              json?: boolean;
            },
            pos1?: string,
            pos2?: string,
          ) => {
            const identifier = flags.contactId ?? flags.email ?? pos1;
            const segmentId = flags.segmentId ?? pos2;
            if (!identifier || !segmentId) {
              stdout(
                formatError("Provide contact (ID or email) and segment ID."),
              );
              return;
            }
            const s = createSpinner({ enabled: !flags.json });
            s.start(`Removing contact from segment ${segmentId}...`);
            try {
              const resend = ResendClient.getInstance();
              const opts = identifier.includes("@")
                ? { email: identifier, segmentId }
                : { contactId: identifier, segmentId };
              const { data, error } =
                await resend.contacts.segments.remove(opts);
              if (error) {
                s.stop(formatError(error.message));
                if (flags.json) stdout(JSON.stringify({ error }, null, 2));
                return;
              }
              s.stop(formatSuccess("Contact removed from segment"));
              if (flags.json) stdout(JSON.stringify(data, null, 2));
            } catch (err: unknown) {
              s.stop(formatError((err as Error).message));
              throw err;
            }
          },
        }),
      },
      docs: { brief: "Manage contact segment membership" },
    }),
    topics: buildRouteMap({
      routes: {
        list: buildCommand({
          parameters: {
            flags: {
              id: {
                kind: "parsed",
                parse: parseString,
                brief: "Contact ID",
                optional: true,
              },
              email: {
                kind: "parsed",
                parse: parseString,
                brief: "Contact email",
                optional: true,
              },
              limit: {
                kind: "parsed",
                parse: parseLimit,
                brief: "Max items (1-100)",
                optional: true,
              },
              after: {
                kind: "parsed",
                parse: parseString,
                brief: "Cursor after",
                optional: true,
              },
              before: {
                kind: "parsed",
                parse: parseString,
                brief: "Cursor before",
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
                  brief: "Contact ID or email",
                  placeholder: "id-or-email",
                  optional: true,
                },
              ],
            },
          },
          docs: { brief: "List topic subscriptions for a contact" },
          func: async (
            flags: {
              id?: string;
              email?: string;
              limit?: number;
              after?: string;
              before?: string;
              json?: boolean;
            },
            positional?: string,
          ) => {
            const identifier = flags.id ?? flags.email ?? positional;
            if (!identifier) {
              stdout(formatError("Provide contact ID or email."));
              return;
            }
            if (flags.after != null && flags.before != null) {
              stdout(formatError("Cannot use both --after and --before."));
              return;
            }
            const s = createSpinner({ enabled: !flags.json });
            s.start("Fetching contact topics...");
            try {
              const resend = ResendClient.getInstance();
              const pagination =
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
              const opts = identifier.includes("@")
                ? { email: identifier, ...pagination }
                : { id: identifier, ...pagination };
              const { data, error } = await resend.contacts.topics.list(opts);
              if (error) {
                s.stop(formatError(error.message));
                if (flags.json) stdout(JSON.stringify({ error }, null, 2));
                return;
              }
              s.stop("Topics fetched");
              if (flags.json) {
                stdout(JSON.stringify(data, null, 2));
                return;
              }
              if (data?.data?.length) {
                const table = formatTable(
                  ["ID", "Name", "Subscription"],
                  data.data.map(
                    (t: {
                      id: string;
                      name?: string;
                      subscription?: string;
                    }) => [t.id, t.name ?? "-", t.subscription ?? "-"],
                  ),
                );
                stdout(table);
              } else {
                stdout("No topic subscriptions.");
              }
            } catch (err: unknown) {
              s.stop(formatError((err as Error).message));
              throw err;
            }
          },
        }),
        update: buildCommand({
          parameters: {
            flags: {
              id: {
                kind: "parsed",
                parse: parseString,
                brief: "Contact ID",
                optional: true,
              },
              email: {
                kind: "parsed",
                parse: parseString,
                brief: "Contact email",
                optional: true,
              },
              topics: {
                kind: "parsed",
                parse: parseString,
                brief:
                  'Topics JSON e.g. [{"id":"topic_xxx","subscription":"opt_in"}]',
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
                  brief: "Contact ID or email",
                  placeholder: "id-or-email",
                  optional: true,
                },
              ],
            },
          },
          docs: { brief: "Update contact topic subscriptions" },
          func: async (
            flags: {
              id?: string;
              email?: string;
              topics?: string;
              json?: boolean;
            },
            positional?: string,
          ) => {
            const identifier = flags.id ?? flags.email ?? positional;
            if (!identifier) {
              stdout(formatError("Provide contact ID or email."));
              return;
            }
            if (!flags.topics) {
              stdout(
                formatError(
                  '--topics is required (JSON array e.g. [{"id":"topic_xxx","subscription":"opt_in"}]).',
                ),
              );
              return;
            }
            let topics: { id: string; subscription: "opt_in" | "opt_out" }[];
            try {
              topics = JSON.parse(flags.topics) as {
                id: string;
                subscription: "opt_in" | "opt_out";
              }[];
              if (
                !Array.isArray(topics) ||
                !topics.every(
                  (t) =>
                    t.id &&
                    (t.subscription === "opt_in" ||
                      t.subscription === "opt_out"),
                )
              ) {
                throw new CliError("Invalid");
              }
            } catch {
              stdout(
                formatError(
                  '--topics must be JSON array e.g. [{"id":"topic_xxx","subscription":"opt_in"}]',
                ),
              );
              return;
            }
            const s = createSpinner({ enabled: !flags.json });
            s.start("Updating contact topics...");
            try {
              const resend = ResendClient.getInstance();
              const payload = identifier.includes("@")
                ? { email: identifier, topics }
                : { id: identifier, topics };
              const { data, error } =
                await resend.contacts.topics.update(payload);
              if (error) {
                s.stop(formatError(error.message));
                if (flags.json) stdout(JSON.stringify({ error }, null, 2));
                return;
              }
              s.stop(formatSuccess("Contact topics updated"));
              if (flags.json) stdout(JSON.stringify(data, null, 2));
            } catch (err: unknown) {
              s.stop(formatError((err as Error).message));
              throw err;
            }
          },
        }),
      },
      docs: { brief: "Manage contact topic subscriptions" },
    }),
  },
  docs: { brief: "Manage contacts and segment/topic membership" },
});
