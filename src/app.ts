import { buildApplication, buildRouteMap } from '@stricli/core';
import pkg from '../package.json' with { type: 'json' };
import { initCommand } from './commands/init.js';
import { emailsRouteMap } from './commands/emails.js';
import { domainsRouteMap } from './commands/domains.js';
import { contactsRouteMap } from './commands/contacts.js';
import { broadcastsRouteMap } from './commands/broadcasts.js';
import { webhooksRouteMap } from './commands/webhooks.js';
import { apiKeysRouteMap } from './commands/api-keys.js';

const version = (pkg as { version: string }).version;

const root = buildRouteMap({
  routes: {
    init: initCommand,
    emails: emailsRouteMap,
    domains: domainsRouteMap,
    contacts: contactsRouteMap,
    broadcasts: broadcastsRouteMap,
    webhooks: webhooksRouteMap,
    keys: apiKeysRouteMap,
  },
  docs: {
    brief: 'CLI for Resend - Power your emails with code',
  },
});

export const app = buildApplication(root, {
  name: 'resend',
  versionInfo: { currentVersion: version },
  scanner: { caseStyle: 'allow-kebab-for-camel' },
});
