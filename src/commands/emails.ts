import * as p from '@clack/prompts';
import { buildCommand, buildRouteMap } from '@stricli/core';
import pc from 'picocolors';
import type { CreateEmailOptions, GetEmailResponseSuccess } from 'resend';

type ListEmailItem = Omit<GetEmailResponseSuccess, 'html' | 'text' | 'tags' | 'object'>;
import { ResendClient } from '../lib/api.js';
import { stdout } from '../lib/logger.js';
import { formatError, formatSuccess, formatTable } from '../lib/output.js';

const stringParse = (s: string) => s;

interface SendFlags {
  from?: string;
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
  json?: boolean;
}

export const emailsRouteMap = buildRouteMap({
  routes: {
    send: buildCommand({
      parameters: {
        flags: {
          from: { kind: 'parsed', parse: stringParse, brief: 'Sender email address', optional: true },
          to: { kind: 'parsed', parse: stringParse, brief: 'Recipient email address', optional: true },
          subject: { kind: 'parsed', parse: stringParse, brief: 'Email subject', optional: true },
          html: { kind: 'parsed', parse: stringParse, brief: 'HTML content', optional: true },
          text: { kind: 'parsed', parse: stringParse, brief: 'Plain text content', optional: true },
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
        aliases: { f: 'from', t: 'to', s: 'subject' },
      },
      docs: { brief: 'Send an email' },
      func: async (flags: SendFlags) => {
        const s = p.spinner();
        s.start('Sending email...');
        try {
          const resend = ResendClient.getInstance();
          const payload = {
            ...(flags.from && { from: flags.from }),
            ...(flags.to && { to: flags.to }),
            ...(flags.subject && { subject: flags.subject }),
            ...(flags.html && { html: flags.html }),
            ...(flags.text && { text: flags.text }),
          };
          const { data, error } = await resend.emails.send(payload as CreateEmailOptions);
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
          json: { kind: 'boolean', brief: 'Output results as JSON', optional: true },
        },
      },
      docs: { brief: 'List sent emails' },
      func: async (flags: { json?: boolean }) => {
        const s = p.spinner();
        s.start('Fetching emails...');
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.emails.list();
          if (error) {
            s.stop(formatError(error.message));
            return;
          }
          s.stop('Emails fetched successfully');
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          if (data?.data) {
            const table = formatTable(
              ['ID', 'Subject', 'Last Event', 'Created At'],
              data.data.map((e: ListEmailItem) => [
                e.id,
                e.subject,
                e.last_event,
                new Date(e.created_at).toLocaleString(),
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
          parameters: [
            { parse: stringParse, brief: 'Email ID', placeholder: 'id' },
          ],
        },
      },
      docs: { brief: 'Get email details' },
      func: async (flags: { json?: boolean }, id: string) => {
        const s = p.spinner();
        s.start(`Fetching email ${id}...`);
        try {
          const resend = ResendClient.getInstance();
          const { data, error } = await resend.emails.get(id);
          if (error) {
            s.stop(formatError(error.message));
            return;
          }
          s.stop('Email details fetched');
          if (flags.json) {
            stdout(JSON.stringify(data, null, 2));
            return;
          }
          const email = data as GetEmailResponseSuccess;
          stdout(pc.cyan('\nEmail Details:'));
          stdout(`${pc.bold('ID:')} ${email.id}`);
          stdout(`${pc.bold('Subject:')} ${email.subject}`);
          stdout(`${pc.bold('From:')} ${email.from}`);
          stdout(`${pc.bold('To:')} ${email.to}`);
          stdout(`${pc.bold('Last event:')} ${email.last_event}`);
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: { brief: 'Manage and send transactional emails' },
});
