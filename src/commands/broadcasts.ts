import * as p from '@clack/prompts';
import { buildCommand, buildRouteMap } from '@stricli/core';
import pc from 'picocolors';
import type { Broadcast, ListBroadcastsResponseSuccess } from 'resend';
import { ResendClient } from '../lib/api.js';
import { stdout } from '../lib/logger.js';
import { formatError, formatTable } from '../lib/output.js';

const stringParse = (s: string) => s;

export const broadcastsRouteMap = buildRouteMap({
  routes: {
    list: buildCommand({
      parameters: {
        flags: {
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
      },
      docs: { brief: 'List broadcasts' },
      func: async (flags: { json?: boolean }) => {
        const s = p.spinner();
        s.start('Fetching broadcasts...');
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.broadcasts.list();
          if (error) {
            s.stop(formatError(error.message));
            return;
          }
          s.stop('Broadcasts fetched');
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data) {
            type ListBroadcastItem = ListBroadcastsResponseSuccess['data'][number];
            const table = formatTable(
              ['ID', 'Name', 'Status', 'Segment'],
              data.data.map((b: ListBroadcastItem) => [
                b.id,
                b.name,
                b.status,
                b.segment_id ?? 'All',
              ])
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
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
        positional: {
          kind: 'tuple',
          parameters: [{ parse: stringParse, brief: 'Broadcast ID', placeholder: 'id' }],
        },
      },
      docs: { brief: 'Get broadcast details' },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = p.spinner();
        s.start(`Fetching broadcast ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.broadcasts.get(id);
          if (error) {
            s.stop(formatError(error.message));
            return;
          }
          s.stop('Broadcast details fetched');
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const broadcast = data as Broadcast;
          stdout(pc.cyan('\nBroadcast Details:'));
          stdout(`${pc.bold('ID:')} ${broadcast.id}`);
          stdout(`${pc.bold('Name:')} ${broadcast.name}`);
          stdout(`${pc.bold('Subject:')} ${broadcast.subject ?? '-'}`);
          stdout(`${pc.bold('Status:')} ${broadcast.status}`);
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: 'Manage marketing broadcasts' },
});
