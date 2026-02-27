import * as p from "@clack/prompts";
import { buildCommand, buildRouteMap } from "@stricli/core";
import pc from "picocolors";
import type {
  CreateDomainOptions,
  Domain,
  DomainCapabilities,
  DomainRegion,
} from "resend";
import { ResendClient } from "../lib/api.js";
import { stdout } from "../lib/logger.js";
import { formatError, formatSuccess, formatTable } from "../lib/output.js";
import { createSpinner } from "../lib/ui.js";
import { parseLimit, parseString } from "../lib/validators/index.js";

const validRegions: DomainRegion[] = [
  "us-east-1",
  "eu-west-1",
  "sa-east-1",
  "ap-northeast-1",
];
const validTls = ["enforced", "opportunistic"] as const;

export const domainsRouteMap = buildRouteMap({
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
      docs: { brief: "List domains (supports pagination)" },
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
        s.start("Fetching domains...");
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
          const { data, error } = await resend.domains.list(listOptions);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Domains fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data) {
            const table = formatTable(
              ["ID", "Name", "Status", "Region"],
              data.data.map((d: Domain) => [d.id, d.name, d.status, d.region]),
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
            { parse: parseString, brief: "Domain ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Get domain details" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Fetching domain ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.domains.get(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop("Domain details fetched");
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const d = data as Domain & { records?: unknown };
          stdout(pc.cyan("\nDomain Details:"));
          stdout(`${pc.bold("ID:")} ${d.id}`);
          stdout(`${pc.bold("Name:")} ${d.name}`);
          stdout(`${pc.bold("Status:")} ${d.status}`);
          stdout(`${pc.bold("Region:")} ${d.region}`);
          if (d.records && Array.isArray(d.records) && d.records.length)
            stdout(`${pc.bold("Records:")} (${d.records.length} DNS records)`);
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    add: buildCommand({
      parameters: {
        flags: {
          region: {
            kind: "parsed",
            parse: parseString,
            brief: "Region (us-east-1, eu-west-1, sa-east-1, ap-northeast-1)",
            optional: true,
          },
          customReturnPath: {
            kind: "parsed",
            parse: parseString,
            brief: "Custom return path subdomain",
            optional: true,
          },
          capabilities: {
            kind: "parsed",
            parse: parseString,
            brief:
              'Capabilities JSON e.g. {"sending":"enabled","receiving":"disabled"}',
            optional: true,
          },
          openTracking: {
            kind: "boolean",
            brief: "Enable open tracking",
            optional: true,
          },
          clickTracking: {
            kind: "boolean",
            brief: "Enable click tracking",
            optional: true,
          },
          tls: {
            kind: "parsed",
            parse: parseString,
            brief: "TLS: enforced or opportunistic",
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
            { parse: parseString, brief: "Domain name", placeholder: "name" },
          ],
        },
      },
      docs: { brief: "Add a new domain" },
      func: async (
        flags: {
          region?: string;
          customReturnPath?: string;
          capabilities?: string;
          openTracking?: boolean;
          clickTracking?: boolean;
          tls?: string;
          json?: boolean;
        },
        name: string,
      ) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Adding domain ${name}...`);
        try {
          const resend = ResendClient.getInstance();
          if (
            flags.region &&
            !validRegions.includes(flags.region as DomainRegion)
          ) {
            s.stop(
              formatError(
                `--region must be one of: ${validRegions.join(", ")}`,
              ),
            );
            return;
          }
          if (
            flags.tls &&
            !validTls.includes(flags.tls as (typeof validTls)[number])
          ) {
            s.stop(formatError('--tls must be "enforced" or "opportunistic"'));
            return;
          }
          let capabilities: Partial<DomainCapabilities> | undefined;
          if (flags.capabilities) {
            try {
              capabilities = JSON.parse(
                flags.capabilities,
              ) as Partial<DomainCapabilities>;
            } catch {
              s.stop(
                formatError(
                  "--capabilities must be valid JSON with sending/receiving (enabled|disabled)",
                ),
              );
              return;
            }
          }
          const payload: CreateDomainOptions = {
            name,
            ...(flags.region && { region: flags.region as DomainRegion }),
            ...(flags.customReturnPath && {
              customReturnPath: flags.customReturnPath,
            }),
            ...(capabilities && { capabilities }),
            ...(flags.openTracking !== undefined && {
              openTracking: flags.openTracking,
            }),
            ...(flags.clickTracking !== undefined && {
              clickTracking: flags.clickTracking,
            }),
            ...(flags.tls && {
              tls: flags.tls as "enforced" | "opportunistic",
            }),
          };
          const { data, error } = await resend.domains.create(payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Domain ${name} added! ID: ${data?.id}`));
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
          clickTracking: {
            kind: "boolean",
            brief: "Enable or disable click tracking",
            optional: true,
          },
          openTracking: {
            kind: "boolean",
            brief: "Enable or disable open tracking",
            optional: true,
          },
          tls: {
            kind: "parsed",
            parse: parseString,
            brief: "TLS: enforced or opportunistic",
            optional: true,
          },
          capabilities: {
            kind: "parsed",
            parse: parseString,
            brief:
              'Capabilities JSON e.g. {"sending":"enabled","receiving":"disabled"}',
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
            { parse: parseString, brief: "Domain ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Update domain settings" },
      func: async (
        flags: {
          clickTracking?: boolean;
          openTracking?: boolean;
          tls?: string;
          capabilities?: string;
          json?: boolean;
        },
        id: string,
      ) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Updating domain ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          if (
            flags.tls &&
            !validTls.includes(flags.tls as (typeof validTls)[number])
          ) {
            s.stop(formatError('--tls must be "enforced" or "opportunistic"'));
            return;
          }
          let capabilities: Partial<DomainCapabilities> | undefined;
          if (flags.capabilities) {
            try {
              capabilities = JSON.parse(
                flags.capabilities,
              ) as Partial<DomainCapabilities>;
            } catch {
              s.stop(formatError("--capabilities must be valid JSON"));
              return;
            }
          }
          const payload = {
            id,
            ...(flags.clickTracking !== undefined && {
              clickTracking: flags.clickTracking,
            }),
            ...(flags.openTracking !== undefined && {
              openTracking: flags.openTracking,
            }),
            ...(flags.tls && {
              tls: flags.tls as "enforced" | "opportunistic",
            }),
            ...(capabilities && { capabilities }),
          };
          const { data, error } = await resend.domains.update(payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Domain updated"));
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
            { parse: parseString, brief: "Domain ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Remove a domain" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Removing domain ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.domains.remove(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) stdout(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess("Domain removed"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    verify: buildCommand({
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
            { parse: parseString, brief: "Domain ID", placeholder: "id" },
          ],
        },
      },
      docs: { brief: "Verify a domain" },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = createSpinner({ enabled: !flags.json });
        s.start(`Verifying domain ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.domains.verify(id);
          if (error) {
            s.stop(formatError(error.message));
            return;
          }
          s.stop(formatSuccess("Domain verification triggered!"));
          if (flags.json) stdout(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: "Manage sending domains" },
});
