# Resend CLI

> **Community-driven CLI for Resend** - Power your emails with code. Built for developers, designed for AI agents.

[![npm version](https://img.shields.io/npm/v/@shubhdeep12/resend-cli.svg)](https://www.npmjs.com/package/@shubhdeep12/resend-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Resend CLI?

The Resend CLI brings the power of Resend's email API to your terminal. Perfect for:

- **Developers**: Test emails during development without leaving the terminal
- **AI Agents**: Claude Code, Cursor, and other coding agents can manage emails autonomously
- **DevOps**: Monitor email health, automate domain setup, and integrate with CI/CD pipelines
- **Analytics**: Query email logs, track bounce rates, and export metrics

## Features

-Full coverage of Resend APIs: emails, domains, contacts, broadcasts, webhooks, API keys
-Built for scripts and AI: every command supports `--json`
-Fast to use: interactive prompts or flags for automation
-Secure by default: init flow, environment variables, or inline auth
-Documented examples for common workflows

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

#### Option 1: Interactive Setup (Recommended)
```bash
resend init
# Follow the prompts to enter your API key
```

#### Option 2: Environment Variable
```bash
export RESEND_API_KEY="re_your_api_key_here"
```

#### Option 3: Inline (CI/CD)
```bash
RESEND_API_KEY="re_xxx" resend emails list
```

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

Send, list, and manage transactional emails.

```bash
# Send email
resend emails send --from "..." --to "..." --subject "..." --html "..."

# List recent emails
resend emails list

# Get email details
resend emails get <email_id>

# All with JSON output
resend emails list --json
```

### Domains

Manage and verify sending domains.

```bash
# List domains
resend domains list

# Add domain
resend domains add yourdomain.com

# Verify domain
resend domains verify <domain_id>
```

### Contacts

Manage audience contacts and segments.

```bash
# List contacts
resend contacts list --audience <audience_id>

# Create contact
resend contacts create \
  --audience <audience_id> \
  --email "user@example.com" \
  --first-name "John"
```

### Broadcasts

Create and manage marketing broadcasts.

```bash
# List broadcasts
resend broadcasts list

# Get broadcast details
resend broadcasts get <broadcast_id>
```

### Webhooks

Configure webhooks for email events.

```bash
# List webhooks
resend webhooks list

# Create webhook
resend webhooks create \
  --url "https://yourapi.com/webhooks" \
  --events email.delivered email.bounced

# Get webhook details
resend webhooks get <webhook_id>

# Update webhook
resend webhooks update <webhook_id> --events email.delivered

# Delete webhook
resend webhooks delete <webhook_id>
```

### API Keys

Manage API keys (requires admin access).

```bash
# List API keys
resend keys list

# Create API key
resend keys create --name "CI/CD Pipeline" --permission "sending_access"

# Delete API key
resend keys delete <key_id>
```

## Examples

The [`examples/`](./examples) folder contains comprehensive guides:

1. **[Basic Email Usage](./examples/01-basic-email.md)** - Getting started with sending emails
2. **[AI Agent Debugging](./examples/02-ai-agent-debugging.md)** - How AI agents can debug email issues autonomously
3. **[CI/CD Integration](./examples/03-ci-cd-integration.sh)** - Automate email testing in pipelines
4. **[Monitoring & Alerts](./examples/04-monitoring.md)** - Email health monitoring patterns
5. **[Bulk Operations](./examples/05-bulk-operations.md)** - Contact and broadcast management at scale

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

### Config File Location

Config is stored in `~/.config/resend-cli/` (or platform equivalent).

### View Current Config

```bash
resend config get
```

### Switch Profiles

```bash
# Set API key for current profile
resend config set api-key <key>

# Use different profile
resend config use-profile production
```

### Environment Variables

- `RESEND_API_KEY` - API key (overrides config file)
- `RESEND_PROFILE` - Profile name to use

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

### Commands Structure

```
resend-cli/
├── src/
│   ├── commands/          # Command implementations
│   │   ├── emails.ts      # Email operations
│   │   ├── domains.ts     # Domain management
│   │   ├── contacts.ts    # Contact management
│   │   ├── broadcasts.ts  # Broadcast campaigns
│   │   ├── webhooks.ts    # Webhook management
│   │   ├── api-keys.ts    # API key management
│   │   └── init.ts        # Authentication setup
│   ├── lib/
│   │   ├── api.ts         # Resend client wrapper
│   │   ├── config.ts      # Configuration management
│   │   └── output.ts      # Formatting utilities
│   └── index.ts           # CLI entry point
└── examples/              # Usage examples
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
- [npm Package](https://www.npmjs.com/package/resend-cli)
- [Resend Documentation](https://resend.com/docs)
- [Report Issues](https://github.com/Shubhdeep12/resend-cli/issues)

## Acknowledgments

Built with ❤️ using the [Resend Node.js SDK](https://github.com/resend/resend-node).
