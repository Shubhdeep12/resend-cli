import * as p from '@clack/prompts';
import { buildCommand, buildRouteMap } from '@stricli/core';
import type { Contact, LegacyCreateContactOptions } from 'resend';
import { ResendClient } from '../lib/api.js';
import { formatError, formatSuccess, formatTable } from '../lib/output.js';

const stringParse = (s: string) => s;

export const contactsRouteMap = buildRouteMap({
  routes: {
    list: buildCommand({
      parameters: {
        flags: {
          audience: { kind: 'parsed', parse: stringParse, brief: 'Audience ID' },
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
        aliases: { a: 'audience' },
      },
      docs: { brief: 'List contacts in an audience' },
      func: async (flags: { audience: string; json?: boolean }) => {
        const s = p.spinner();
        s.start('Fetching contacts...');
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.contacts.list({ audienceId: flags.audience });
          if (error) {
            s.stop(formatError(error.message));
            return;
          }
          s.stop('Contacts fetched');
          if (flags.json) {
            console.log(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data) {
            const table = formatTable(
              ['ID', 'Email', 'First Name', 'Last Name', 'Created At'],
              data.data.map((c: Contact) => [
                c.id,
                c.email,
                c.first_name ?? '-',
                c.last_name ?? '-',
                new Date(c.created_at).toLocaleString(),
              ])
            );
            console.log(table);
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
          audience: { kind: 'parsed', parse: stringParse, brief: 'Audience ID' },
          email: { kind: 'parsed', parse: stringParse, brief: 'Contact email' },
          firstName: { kind: 'parsed', parse: stringParse, brief: 'First name', optional: true },
          lastName: { kind: 'parsed', parse: stringParse, brief: 'Last name', optional: true },
          unsubscribed: { kind: 'boolean', brief: 'Whether the contact is unsubscribed', optional: true },
        },
        aliases: { a: 'audience', e: 'email', f: 'firstName', l: 'lastName' },
      },
      docs: { brief: 'Add a contact to an audience' },
      func: async (flags: { audience: string; email: string; firstName?: string; lastName?: string; unsubscribed?: boolean }) => {
        const s = p.spinner();
        s.start(`Adding contact ${flags.email}...`);
        try {
          const resend = ResendClient.getInstance();
          const payload: LegacyCreateContactOptions = {
            audienceId: flags.audience,
            email: flags.email,
            ...(flags.firstName && { firstName: flags.firstName }),
            ...(flags.lastName && { lastName: flags.lastName }),
            ...(flags.unsubscribed !== undefined && { unsubscribed: flags.unsubscribed }),
          };
          const { data, error } = await resend.contacts.create(payload);
          if (error) {
            s.stop(formatError(error.message));
            return;
          }
          s.stop(formatSuccess(`Contact added! ID: ${data?.id}`));
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: 'Manage audience contacts' },
});
