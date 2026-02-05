import * as p from '@clack/prompts';
import { buildCommand, buildRouteMap } from '@stricli/core';
import pc from 'picocolors';
import type { CreateWebhookOptions, UpdateWebhookOptions, WebhookEvent } from 'resend';
import { ResendClient } from '../lib/api.js';
import { formatError, formatSuccess, formatTable } from '../lib/output.js';

const stringParse = (s: string) => s;

export const webhooksRouteMap = buildRouteMap({
  routes: {
    list: buildCommand({
      parameters: {
        flags: {
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
      },
      docs: { brief: 'List all webhooks' },
      func: async (flags: { json?: boolean }) => {
        const s = p.spinner();
        s.start('Fetching webhooks...');
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.webhooks.list();
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) console.log(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop('Webhooks fetched');
          if (flags.json) {
            console.log(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data?.length) {
            const table = formatTable(
              ['ID', 'Endpoint', 'Status', 'Created At'],
              data.data.map((w: { id: string; endpoint: string; status?: string; created_at: string }) => [
                w.id,
                w.endpoint.substring(0, 50) + (w.endpoint.length > 50 ? '...' : ''),
                w.status ?? 'active',
                new Date(w.created_at).toLocaleString(),
              ])
            );
            console.log(table);
          } else {
            console.log(pc.yellow('No webhooks found'));
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
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
        positional: {
          kind: 'tuple',
          parameters: [{ parse: stringParse, brief: 'Webhook ID', placeholder: 'id' }],
        },
      },
      docs: { brief: 'Get webhook details' },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = p.spinner();
        s.start(`Fetching webhook ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.webhooks.get(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) console.log(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop('Webhook details fetched');
          if (flags.json) {
            console.log(JSON.stringify(data, null, 2));
            return;
          }
          console.log(pc.cyan('\nWebhook Details:'));
          console.log(`${pc.bold('ID:')} ${data?.id}`);
          console.log(`${pc.bold('Endpoint:')} ${data?.endpoint}`);
          console.log(`${pc.bold('Status:')} ${data?.status ?? 'active'}`);
          console.log(`${pc.bold('Events:')} ${data?.events?.join(', ') ?? 'all'}`);
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    create: buildCommand({
      parameters: {
        flags: {
          url: { kind: 'parsed', parse: stringParse, brief: 'Webhook endpoint URL' },
          events: { kind: 'parsed', parse: stringParse, brief: 'Event types to listen for', optional: true, variadic: true },
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
        aliases: { u: 'url', e: 'events' },
      },
      docs: { brief: 'Create a new webhook' },
      func: async (flags: { url: string; events?: string[]; json?: boolean }) => {
        const s = p.spinner();
        s.start('Creating webhook...');
        try {
          const resend = ResendClient.getInstance();
          const createPayload: CreateWebhookOptions = {
            endpoint: flags.url,
            events: (flags.events ?? []) as WebhookEvent[],
          };
          const { data, error } = await resend.webhooks.create(createPayload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) console.log(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess(`Webhook created! ID: ${data?.id}`));
          if (flags.json) console.log(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    update: buildCommand({
      parameters: {
        flags: {
          events: { kind: 'parsed', parse: stringParse, brief: 'Event types to listen for', optional: true, variadic: true },
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
        aliases: { e: 'events' },
        positional: {
          kind: 'tuple',
          parameters: [{ parse: stringParse, brief: 'Webhook ID', placeholder: 'id' }],
        },
      },
      docs: { brief: 'Update a webhook' },
      func: async (flags: { events?: string[]; json?: boolean }, id: string) => {
        const s = p.spinner();
        s.start(`Updating webhook ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const updatePayload: UpdateWebhookOptions = {
            events: flags.events?.length ? (flags.events as WebhookEvent[]) : undefined,
          };
          const { data, error } = await resend.webhooks.update(id, updatePayload);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) console.log(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess('Webhook updated!'));
          if (flags.json) console.log(JSON.stringify(data, null, 2));
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
          parameters: [{ parse: stringParse, brief: 'Webhook ID', placeholder: 'id' }],
        },
      },
      docs: { brief: 'Delete a webhook' },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = p.spinner();
        s.start(`Deleting webhook ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.webhooks.remove(id);
          if (error) {
            s.stop(formatError(error.message));
            if (flags.json) console.log(JSON.stringify({ error }, null, 2));
            return;
          }
          s.stop(formatSuccess('Webhook deleted!'));
          if (flags.json) console.log(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: 'Manage webhooks for email events' },
});
