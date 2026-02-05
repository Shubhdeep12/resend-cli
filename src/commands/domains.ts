import * as p from '@clack/prompts';
import { buildCommand, buildRouteMap } from '@stricli/core';
import type { CreateDomainOptions, Domain, DomainRegion } from 'resend';
import { ResendClient } from '../lib/api.js';
import { formatError, formatSuccess, formatTable } from '../lib/output.js';

const stringParse = (s: string) => s;

export const domainsRouteMap = buildRouteMap({
  routes: {
    list: buildCommand({
      parameters: {
        flags: {
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
      },
      docs: { brief: 'List domains' },
      func: async (flags: { json?: boolean }) => {
        const s = p.spinner();
        s.start('Fetching domains...');
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.domains.list();
          if (error) {
            s.stop(formatError(error.message));
            return;
          }
          s.stop('Domains fetched');
          if (flags.json) {
            console.log(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data) {
            const table = formatTable(
              ['ID', 'Name', 'Status', 'Region'],
              data.data.map((d: Domain) => [d.id, d.name, d.status, d.region])
            );
            console.log(table);
          }
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    add: buildCommand({
      parameters: {
        flags: {
          region: { kind: 'parsed', parse: stringParse, brief: 'AWS Region (us-east-1, eu-west-1, sa-east-1)', optional: true },
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
        positional: {
          kind: 'tuple',
          parameters: [{ parse: stringParse, brief: 'Domain name', placeholder: 'name' }],
        },
      },
      docs: { brief: 'Add a new domain' },
      func: async (flags: { region?: string; json?: boolean }, name: string) => {
        const s = p.spinner();
        s.start(`Adding domain ${name}...`);
        try {
          const resend = ResendClient.getInstance();
          const payload: CreateDomainOptions = { name, ...(flags.region && { region: flags.region as DomainRegion }) };
          const { data, error } = await resend.domains.create(payload);
          if (error) {
            s.stop(formatError(error.message));
            return;
          }
          s.stop(formatSuccess(`Domain ${name} added! ID: ${data?.id}`));
          if (flags.json) console.log(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    verify: buildCommand({
      parameters: {
        flags: {
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
        positional: {
          kind: 'tuple',
          parameters: [{ parse: stringParse, brief: 'Domain ID', placeholder: 'id' }],
        },
      },
      docs: { brief: 'Verify a domain' },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = p.spinner();
        s.start(`Verifying domain ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.domains.verify(id);
          if (error) {
            s.stop(formatError(error.message));
            return;
          }
          s.stop(formatSuccess('Domain verification triggered!'));
          if (flags.json) console.log(JSON.stringify(data, null, 2));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: 'Manage sending domains' },
});
