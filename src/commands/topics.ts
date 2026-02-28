import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import type { Topic } from "resend";
import { ResendClient } from "../lib/api.js";
import { stdout } from "../lib/logger.js";
import { formatError, formatSuccess, formatTable } from "../lib/output.js";
import { createSpinner } from "../lib/ui.js";
import { parseString } from "../lib/validators/index.js";

export const topicsRouteMap = buildRouteMap({
  routes: {
    list: buildCommand({
      parameters: {
        flags: {
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
      },
      docs: { brief: "List all topics" },
      func: async (flags: { json?: boolean }) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start("Fetching topics...");
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.topics.list();
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
              ["ID", "Name", "Description", "Default subscription"],
              data.data.map((t: Topic) => [
                t.id,
                t.name,
                t.description ?? "",
                (t as Topic & { default_subscription?: string })
                  .default_subscription ?? "",
              ]),
            );
            stdout(table);
          } else {
            stdout(pc.yellow("No topics found"));
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
            { parse: parseString, brief: "Topic ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Get topic by ID" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Fetching topic ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.topics.get(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Topic fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const t = data as Topic;
          stdout(pc.cyan("\nTopic:"));
          stdout(`${pc.bold("ID:")} ${t.id}`);
          stdout(`${pc.bold("Name:")} ${t.name}`);
          stdout(`${pc.bold("Description:")} ${t.description ?? "-"}`);
          stdout(
            `${pc.bold("Default subscription:")} ${(t as Topic & { default_subscription?: string }).default_subscription ?? "-"}`,
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
          name: {
            kind: "parsed",
            parse: parseString,
            brief: "Topic name",
            optional: true,
          },
          defaultSubscription: {
            kind: "parsed",
            parse: parseString,
            brief: "opt_in or opt_out",
            optional: true,
          },
          description: {
            kind: "parsed",
            parse: parseString,
            brief: "Topic description",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { n: "name", d: "defaultSubscription" },
      },
      docs: {
        brief: "Create a topic (--name and --default-subscription required)",
      },
      func: async (flags: {
        name?: string;
        defaultSubscription?: string;
        description?: string;
        json?: boolean;
      }) => {
        if (!flags.name) {
          stdout(formatError("--name is required"));
          return;
        }
        if (
          !flags.defaultSubscription ||
          !["opt_in", "opt_out"].includes(flags.defaultSubscription)
        ) {
          stdout(
            formatError(
              "--default-subscription is required and must be opt_in or opt_out",
            ),
          );
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start("Creating topic...");
        try {
          const resend = ResendClient.getInstance();
          const payload = {
            name: flags.name,
            defaultSubscription: flags.defaultSubscription as
              | "opt_in"
              | "opt_out",
            ...(flags.description && { description: flags.description }),
          };
          const { data, error } = await resend.topics.create(payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Topic created! ID: ${data?.id}`));
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
            brief: "Topic name",
            optional: true,
          },
          description: {
            kind: "parsed",
            parse: parseString,
            brief: "Topic description",
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
            { parse: parseString, brief: "Topic ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Update a topic (--name and/or --description)" },
      func: async (
        flags: { name?: string; description?: string; json?: boolean },
        id: string,
      ) => {
        if (!flags.name && flags.description === undefined) {
          stdout(
            formatError("Provide at least one of --name or --description"),
          );
          return;
        }
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Updating topic ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const payload: { id: string; name?: string; description?: string } = {
            id,
          };
          if (flags.name) payload.name = flags.name;
          if (flags.description !== undefined)
            payload.description = flags.description;
          const { data, error } = await resend.topics.update(payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Topic updated"));
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
            { parse: parseString, brief: "Topic ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Remove a topic" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Removing topic ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.topics.remove(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Topic removed"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: "Manage topics (subscription preferences)" },
});
