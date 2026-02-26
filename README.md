# Resend CLI

**Unofficial** CLI for [Resend](https://resend.com).

[![npm version](https://img.shields.io/npm/v/@shubhdeep12/resend-cli.svg)](https://www.npmjs.com/package/@shubhdeep12/resend-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Use Resend from the terminal: send emails, manage domains, contacts, webhooks, API keys, broadcasts, templates, and more. List/get/create/update commands support `--json`; list commands support `--limit`, `--after`, and `--before` for pagination.

## AI / Agent usage

Built for use by AI agents (Cursor, Claude, Copilot, etc.):

- **Non-interactive**: Set `RESEND_API_KEY` in the environment; no `resend auth login` prompts.
- **Structured output**: Use `--json` on every data command so stdout is a single JSON object (or one JSON line) you can parse.
- **Discoverable**: Run `resend --help` and `resend <command> --help` for usage and flags.
- **Exit codes**: `0` on success; non-zero on error. Errors with `--json` include a JSON object with an `error` field (`name`, `message`, `statusCode`).

```bash
# Agent-friendly examples
export RESEND_API_KEY="re_xxx"

resend emails list --json --limit 5
resend emails send --from "noreply@example.com" --to "user@example.com" --subject "Hi" --html "<p>Hi</p>" --json
resend domains list --json
resend emails get <email_id> --json
```

See [examples/02-ai-agent-debugging.md](./examples/02-ai-agent-debugging.md) for full agent workflows (debugging, bounces, webhooks, templates).

## Install

```bash
npm install -g @shubhdeep12/resend-cli
```

Or with npx: `npx @shubhdeep12/resend-cli emails list --json`

## Auth

```bash
# Save/select a local key
resend auth login --key re_xxx --name default
# or interactive
resend auth login

# Show current auth source
resend auth whoami

# List saved local keys
resend auth list

# Switch active saved key
resend auth select <name>

# Remove saved key(s)
resend auth logout
resend auth logout --name <name>
resend auth logout --all

```

Or set `RESEND_API_KEY`. For CI: `RESEND_API_KEY="re_xxx" resend emails list`.
If `RESEND_API_KEY` is set, it overrides saved keys for that process.

## Quick start

```bash
# Send
resend emails send --from "onboarding@yourdomain.com" --to "user@example.com" --subject "Hi" --html "<strong>Hi</strong>"

# List (table or JSON)
resend emails list
resend emails list --json
```

## Commands

### Emails

```bash
resend emails send --from "..." --to "..." --subject "..." --html "..."
resend emails list [--limit 20] [--after <id> | --before <id>]
resend emails get <email_id>
resend emails update <email_id> --scheduled-at "2025-01-15T10:00:00Z"
resend emails cancel <email_id>
resend emails batch --file payloads.json [--validation permissive] [--idempotency-key key]

resend emails attachments list <email_id>
resend emails attachments get <email_id> <attachment_id>

resend emails receiving list
resend emails receiving get <id>
resend emails receiving forward --email-id <id> --to "..." --from "..."

resend emails receiving attachments list <email_id>
resend emails receiving attachments get <email_id> <attachment_id>
```

### Domains

```bash
resend domains list [--limit 20] [--after <id> | --before <id>]
resend domains add <domain> [--region us-east-1] [--open-tracking] [--click-tracking]
resend domains get <domain_id>
resend domains update <domain_id> [--open-tracking] [--click-tracking]
resend domains remove <domain_id>
resend domains verify <domain_id>
```

### Contacts

```bash
resend contacts list [--segment-id <id>] [--limit 20] [--after <id> | --before <id>]
resend contacts create --email "..." [--segments <id1,id2>] [--topics <id1,id2>] [--properties '{}']
resend contacts get <id_or_email>
resend contacts update <id_or_email> [--first-name ...] [--unsubscribed] [--properties '{}']
resend contacts remove <id_or_email>

resend contacts segments list [--limit 20] [--after <id> | --before <id>]
resend contacts topics list [--limit 20] [--after <id> | --before <id>]
resend contacts topics update <id_or_email> --topics '[{"id":"..."}]'
```

### Contact properties, segments, topics

```bash
resend contact-properties list [--limit 20] [--after <id> | --before <id>]
resend contact-properties create --key "plan" --type string [--fallback-value "free"]
resend contact-properties get <id>
resend contact-properties update <id> --fallback-value "pro"
resend contact-properties remove <id>

resend segments list [--limit 20] [--after <id> | --before <id>]
resend segments create --name "Newsletter"
resend segments get <id>
resend segments remove <id>

resend topics list
resend topics create --name "Product updates" --default-subscription opt_in [--description "..."]
resend topics get <id>
resend topics update <id> [--name ...] [--description ...]
resend topics remove <id>
```

### Broadcasts

```bash
resend broadcasts list [--limit 20] [--after <id> | --before <id>]
resend broadcasts create --name "..." --segment-id <id> --from "..." --subject "..." --html "..."
resend broadcasts get <id>
resend broadcasts send <id> [--scheduled-at "..."]
resend broadcasts update <id> [--subject ...] [--html-file ...]
resend broadcasts remove <id>
```

### Templates

```bash
resend templates list [--limit 20] [--after <id> | --before <id>]
resend templates create --name "Welcome" --html "<p>Hi</p>" [--subject "Welcome"] [--html-file path/to.html]
resend templates get <id>
resend templates update <id> [--name ...] [--html ...] [--html-file ...]
resend templates remove <id>
resend templates duplicate <id>
resend templates publish <id>
```

### Webhooks

```bash
resend webhooks list [--limit 20] [--after <id> | --before <id>]
resend webhooks create --url "https://yourapi.com/webhooks" [--events email.delivered email.bounced]
resend webhooks get <webhook_id>
resend webhooks update <webhook_id> [--endpoint ...] [--status enabled|disabled] [--events ...]
resend webhooks delete <webhook_id>
```

### API keys

```bash
resend keys list [--limit 20] [--after <id> | --before <id>]
resend keys create --name "CI/CD" [--permission sending_access] [--domain-id <id>]
resend keys delete <key_id>
```

Pagination: `--limit` (1–100), `--after <id>` or `--before <id>` (don’t use both). Use `--json` on any data command for script output.

## Examples

- [Basic email](./examples/01-basic-email.md) – send, attachments, scheduling
- [AI / scripts](./examples/02-ai-agent-debugging.md) – `--json` and jq
- [CI/CD](./examples/03-ci-cd-integration.sh)
- [Monitoring](./examples/04-monitoring.md)
- [Bulk ops](./examples/05-bulk-operations.md)

`resend <group> --help` for full options (e.g. `resend emails --help`).

## Config

- **Config file**: After `resend auth login`, keys are in `~/.config/resend-cli/config.json` (Linux/macOS).
- **Env**: `RESEND_API_KEY` (required unless saved via login), optional `RESEND_BASE_URL`, `RESEND_USER_AGENT`.
- **Logs**: Pino to stderr. `LOG_LEVEL`, `DEBUG=1`, `LOG_FORMAT=json`.

## Dev

```bash
git clone https://github.com/Shubhdeep12/resend-cli.git && cd resend-cli
pnpm install && pnpm run build
npm link
resend --version
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API key not found | `resend auth login` or `export RESEND_API_KEY="re_..."` |
| Invalid key format | Keys start with `re_`. Get from [Resend Dashboard](https://resend.com/api-keys). |
| Domain not verified | `resend domains list --json \| jq '.data[] \| .records'` then add DNS and `resend domains verify <id>` |
| Rate limits | Add delays between calls in scripts. |

## Contributing

PRs welcome. Fork, branch, push, open a PR.

## License

MIT © [Shubhdeep](https://github.com/Shubhdeep12)

[Repo](https://github.com/Shubhdeep12/resend-cli) · [npm](https://www.npmjs.com/package/@shubhdeep12/resend-cli) · [Resend docs](https://resend.com/docs) · [Issues](https://github.com/Shubhdeep12/resend-cli/issues)
