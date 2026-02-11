# Resend CLI

[![npm version](https://img.shields.io/npm/v/@shubhdeep12/resend-cli.svg)](https://www.npmjs.com/package/@shubhdeep12/resend-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Resend CLI?

The Resend CLI brings the power of Resend's email API to your terminal. Perfect for:

- **Developers**: Test emails during development without leaving the terminal
- **AI Agents**: Claude Code, Cursor, and other coding agents can manage emails autonomously
- **DevOps**: Monitor email health, automate domain setup, and integrate with CI/CD pipelines
- **Analytics**: Query email logs, track bounce rates, and export metrics

## Features

- **Full Resend API coverage**: emails (send, list, get, update, cancel, batch; attachments; receiving + forward), domains, contacts (with segments/topics), contact-properties, segments, topics, broadcasts, templates, webhooks, API keys
- **Script- and AI-friendly**: list/get/create/update commands support `--json` for parsing
- **Pagination**: list commands support `--limit` (1–100), `--after <id>`, and `--before <id>` (use only one of `--after` or `--before` for cursor-based paging)
- Secure by default: `resend init`, environment variables, or inline auth
- Documented examples for common workflows

## Installation

```bash
npm install -g @shubhdeep12/resend-cli
```

Or use with `npx`:
```bash
npx @shubhdeep12/resend-cli emails list --json
```

## Quick Start

### 1. Authenticate

Choose your preferred authentication method:

#### Option 1: Interactive setup (recommended)
```bash
resend init
# Follow the prompts to enter your API key (saved to config)

# Optionally write to .env in current directory
resend init --write-env
```

#### Option 2: Environment variable
```bash
export RESEND_API_KEY="re_your_api_key_here"
```

#### Option 3: Inline (CI/CD)
```bash
RESEND_API_KEY="re_xxx" resend emails list
```

After `resend init`, the CLI prints available env vars: `RESEND_API_KEY`, optional `RESEND_BASE_URL`, `RESEND_USER_AGENT`.

### 2. Send Your First Email

```bash
resend emails send \
  --from "onboarding@yourdomain.com" \
  --to "user@example.com" \
  --subject "Hello from CLI" \
  --html "<strong>It works!</strong>"
```

### 3. List Recent Emails

```bash
# Pretty table output
resend emails list

# JSON output for scripts/AI agents
resend emails list --json
```

## Commands

### Emails

Send, list, manage, and batch transactional emails; list/get attachments; manage receiving (inbound) emails.

```bash
# Send email (supports cc, bcc, reply-to, tags, schedule, attachments, template)
resend emails send --from "..." --to "..." --subject "..." --html "..."
# Optional: --tags '[{"name":"campaign","value":"welcome"}]' --headers '{"X-Custom":"val"}'

# List / get / update / cancel
resend emails list [--limit 20] [--after <id> | --before <id>]
resend emails get <email_id>
resend emails update <email_id> --scheduled-at "2025-01-15T10:00:00Z"
resend emails cancel <email_id>

# Batch send (JSON array from file or stdin)
resend emails batch --file payloads.json [--validation permissive] [--idempotency-key key]
cat payloads.json | resend emails batch

# Sent email attachments (metadata + download URL)
resend emails attachments list <email_id>
resend emails attachments get <email_id> <attachment_id>

# Receiving (inbound) emails
resend emails receiving list
resend emails receiving get <id>
resend emails receiving forward --email-id <id> --to "..." --from "..." [--passthrough false --html "..."]

# Receiving attachments
resend emails receiving attachments list <email_id>
resend emails receiving attachments get <email_id> <attachment_id>
```

### Domains

Manage and verify sending domains.

```bash
resend domains list [--limit 20] [--after <id> | --before <id>]
resend domains add <domain> [--region us-east-1] [--open-tracking] [--click-tracking]
resend domains get <domain_id>
resend domains update <domain_id> [--open-tracking] [--click-tracking]
resend domains remove <domain_id>
resend domains verify <domain_id>
```

### Contacts

Manage contacts, segments, and topics.

```bash
resend contacts list [--segment-id <id>] [--limit 20] [--after <id> | --before <id>]
resend contacts create --email "..." [--segments <id1,id2>] [--topics <id1,id2>] [--properties '{}']
resend contacts get <id_or_email>
resend contacts update <id_or_email> [--first-name ...] [--unsubscribed] [--properties '{}']
resend contacts remove <id_or_email>
# Nested: segments add/list/remove; topics list/update
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

Create and manage marketing broadcasts.

```bash
resend broadcasts list [--limit 20] [--after <id> | --before <id>]
resend broadcasts create --name "..." --segment-id <id> --from "..." --subject "..." --html "..."
resend broadcasts get <id>
resend broadcasts send <id> [--scheduled-at "..."]
resend broadcasts update <id> [--subject ...] [--html-file ...]
resend broadcasts remove <id>
```

### Templates

Manage email templates (HTML only; no React).

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

Configure webhooks for email events.

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

### Pagination and JSON

- **Pagination**: Use `--limit` (1–100) and either `--after <id>` (next page) or `--before <id>` (previous page). Do not use `--after` and `--before` together.
- **JSON**: Add `--json` to any command that returns data for script-friendly output.

## Examples

The [`examples/`](./examples) folder contains guides and scripts:

1. **[Basic Email](./examples/01-basic-email.md)** – Sending emails (HTML, attachments, scheduling)
2. **[AI Agent Debugging](./examples/02-ai-agent-debugging.md)** – Using `--json` for autonomous debugging
3. **[CI/CD Integration](./examples/03-ci-cd-integration.sh)** – Email testing in pipelines
4. **[Monitoring](./examples/04-monitoring.md)** – Email health and metrics
5. **[Bulk Operations](./examples/05-bulk-operations.md)** – Contacts, segments, broadcasts at scale

For more CLI surface (batch, templates, segments, topics, contact-properties, receiving, attachments), see the [Commands](#commands) section and run `resend <group> --help` (e.g. `resend emails --help`, `resend templates --help`).

## AI Agent Integration

Every command supports `--json` for easy parsing:

```bash
# Get email status
result=$(resend emails get <id> --json)
status=$(echo $result | jq -r '.status')

# List and filter
resend emails list --json | jq '.data[] | select(.status == "bounced")'

# Chain commands
resend emails list --json | \
  jq '.data[0].id' | \
  xargs -I {} resend emails get {} --json
```

**See the [AI Agent Debugging Guide](./examples/02-ai-agent-debugging.md) for more patterns.**

## Configuration

### Config file

After `resend init`, the API key is stored in the CLI config (e.g. `~/.config/resend-cli/config.json` on Linux/macOS). Use `resend init --write-env` to append `RESEND_API_KEY` to a `.env` file in the current directory.

### Environment variables

- **`RESEND_API_KEY`** – API key (required if not set via init; overrides config when set)
- **`RESEND_BASE_URL`** – Optional override for API base URL (default: `https://api.resend.com`)
- **`RESEND_USER_AGENT`** – Optional override for User-Agent

### Logging

The CLI uses [pino](https://github.com/pinojs/pino) for structured logging. Logs go to **stderr** so stdout stays clean for `--json` and tables.

- **`LOG_LEVEL`** – `trace` | `debug` | `info` | `warn` | `error` | `fatal` (default: `info`)
- **`DEBUG`** – set to `1` (or any value) to enable `debug` level
- **`LOG_FORMAT`** – set to `json` to force JSON lines (e.g. for scripts); otherwise logs are pretty-printed when the output is a TTY

Example: `DEBUG=1 resend emails list` prints debug logs to stderr.

## Use Cases

### For Developers

```bash
# Test password reset email during development
resend emails send \
  --from "noreply@app.com" \
  --to "dev@example.com" \
  --subject "Password Reset" \
  --html "<a href='https://app.com/reset/token123'>Reset</a>"

# Verify domain before deploying
resend domains list --json | jq '.data[] | {name, status}'
```

### For AI Agents

```bash
# Claude Code debugging email delivery
resend emails list --json | \
  jq '.data[] | select(.to == "user@example.com") | select(.subject | contains("reset"))'

# Automated bounce analysis
resend emails list --json | \
  jq '[.data[] | select(.status == "bounced")] | group_by(.bounce_reason)'
```

### For DevOps

```bash
# CI/CD: Verify domain is ready
resend domains list --json | \
  jq '.data[] | select(.name == "app.com") | .status == "verified"'

# Monitor bounce rate
resend emails list --json | \
  jq '(.data | map(select(.status == "bounced")) | length) / (.data | length) * 100'
```

## Development

### Local Development

```bash
# Clone repo
git clone https://github.com/Shubhdeep12/resend-cli.git
cd resend-cli

# Install dependencies
pnpm install

# Build
pnpm run build

# Link globally for testing
npm link

# Test
resend --version
```

### Commands structure

```
resend-cli/
├── src/
│   ├── commands/
│   │   ├── emails.ts           # send, list, get, update, cancel, batch; attachments; receiving
│   │   ├── domains.ts         # list, add, get, update, remove, verify
│   │   ├── contacts.ts        # list, create, get, update, remove; segments; topics
│   │   ├── contact-properties.ts
│   │   ├── segments.ts
│   │   ├── topics.ts
│   │   ├── broadcasts.ts
│   │   ├── templates.ts
│   │   ├── webhooks.ts
│   │   ├── api-keys.ts
│   │   └── init.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── config.ts
│   │   ├── logger.ts
│   │   └── output.ts
│   └── app.ts / index.ts
└── examples/
```

## Troubleshooting

### "API key not found" Error

Make sure you've configured authentication:

```bash
# Option 1: Run init
resend init

# Option 2: Set environment variable
export RESEND_API_KEY="re_your_key"
```

### "Invalid API Key format" Error

Resend API keys start with `re_`. Double-check your key from the [Resend Dashboard](https://resend.com/api-keys).

### Domain Not Verified

```bash
# Get DNS records
resend domains list --json | jq '.data[] | .records'

# Add records to your DNS provider, then verify
resend domains verify <domain_id>
```

### Rate Limiting

The CLI respects Resend's rate limits. If you hit limits, add delays between commands:

```bash
# Example with delay
for id in $(cat email_ids.txt); do
  resend emails get $id
  sleep 0.1  # 100ms delay
done
```

## Contributing

Contributions are welcome! This is a community project.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [Shubhdeep](https://github.com/Shubhdeep12)

## Links

- [GitHub Repository](https://github.com/Shubhdeep12/resend-cli)
- [npm Package](https://www.npmjs.com/package/@shubhdeep12/resend-cli)
- [Resend Documentation](https://resend.com/docs)
- [Report Issues](https://github.com/Shubhdeep12/resend-cli/issues)

