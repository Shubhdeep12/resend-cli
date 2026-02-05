import * as p from '@clack/prompts';
import { buildCommand, buildRouteMap } from '@stricli/core';
import pc from 'picocolors';
import type { CreateApiKeyOptions, CreateApiKeyResponseSuccess } from 'resend';
import { ResendClient } from '../lib/api.js';
import { formatError, formatSuccess, formatTable } from '../lib/output.js';

const stringParse = (s: string) => s;

export const apiKeysRouteMap = buildRouteMap({
  routes: {
    list: buildCommand({
      parameters: {
        flags: {
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
      },
      docs: { brief: 'List all API keys' },
      func: async (flags: { json?: boolean }) => {
        const s = p.spinner();
        s.start('Fetching API keys...');
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.apiKeys.list();
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) console.log(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop('API keys fetched');
          if (flags.json) {
            console.log(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data?.length) {
            const table = formatTable(
              ['ID', 'Name', 'Created At'],
              data.data.map((k: { id: string; name: string; created_at: string }) => [
                k.id,
                k.name,
                new Date(k.created_at).toLocaleString(),
              ])
            );
            console.log(table);
          } else {
            console.log(pc.yellow('No API keys found'));
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
          name: { kind: 'parsed', parse: stringParse, brief: 'API key name' },
          permission: { kind: 'parsed', parse: stringParse, brief: 'Permission level (full_access, sending_access)', optional: true },
          domainId: { kind: 'parsed', parse: stringParse, brief: 'Domain ID to restrict key to', optional: true },
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
        aliases: { n: 'name', p: 'permission', d: 'domainId' },
      },
      docs: { brief: 'Create a new API key' },
      func: async (flags: { name: string; permission?: string; domainId?: string; json?: boolean }) => {
        const s = p.spinner();
        s.start('Creating API key...');
        try {
          const resend = ResendClient.getInstance();
          const payload: CreateApiKeyOptions = {
            name: flags.name,
            ...(flags.permission && {
              permission: flags.permission as CreateApiKeyOptions['permission'],
            }),
            ...(flags.domainId && { domain_id: flags.domainId }),
          };
          const { data, error } = await resend.apiKeys.create(payload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) console.log(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`API key created! ID: ${data?.id}`));
          if (flags.json) {
            console.log(JSON.stringify(data, null, 2));
          } else {
            const details = data as CreateApiKeyResponseSuccess & { name?: string };
            console.log(pc.cyan('\nAPI Key Details:'));
            console.log(`${pc.bold('ID:')} ${details.id}`);
            console.log(`${pc.bold('Name:')} ${details.name ?? flags.name}`);
            console.log(`${pc.bold('Token:')} ${pc.red(details.token ?? 'N/A')}`);
            console.log(pc.yellow("\nImportant: save this token now - it won't be shown again."));
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
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
        positional: {
          kind: 'tuple',
          parameters: [{ parse: stringParse, brief: 'API key ID', placeholder: 'id' }],
        },
      },
      docs: { brief: 'Delete an API key' },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = p.spinner();
        s.start(`Deleting API key ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.apiKeys.remove(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) console.log(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess('API key deleted!'));
          if (flags.json) console.log(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: 'Manage API keys' },
});
