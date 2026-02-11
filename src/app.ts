import { buildApplication, buildRouteMap } from "@stricli/core";
import pkg from "../package.json" with { type: "json" };
import { apiKeysRouteMap } from "./commands/api-keys.js";
import { broadcastsRouteMap } from "./commands/broadcasts.js";
import { contactPropertiesRouteMap } from "./commands/contact-properties.js";
import { contactsRouteMap } from "./commands/contacts.js";
import { domainsRouteMap } from "./commands/domains.js";
import { emailsRouteMap } from "./commands/emails.js";
import { initCommand } from "./commands/init.js";
import { segmentsRouteMap } from "./commands/segments.js";
import { templatesRouteMap } from "./commands/templates.js";
import { topicsRouteMap } from "./commands/topics.js";
import { webhooksRouteMap } from "./commands/webhooks.js";

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
    segments: segmentsRouteMap,
    topics: topicsRouteMap,
    "contact-properties": contactPropertiesRouteMap,
    templates: templatesRouteMap,
  },
  docs: {
    brief: "CLI for Resend - Power your emails with code",
  },
});

export const app = buildApplication(root, {
  name: "resend",
  versionInfo: { currentVersion: version },
  scanner: { caseStyle: "allow-kebab-for-camel" },
});
