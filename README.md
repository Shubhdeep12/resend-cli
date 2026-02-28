# Resend CLI

Unofficial CLI for [Resend](https://resend.com)

[![npm version](https://img.shields.io/npm/v/@shubhdeep12/resend-cli.svg)](https://www.npmjs.com/package/@shubhdeep12/resend-cli)
[![Latest](https://img.shields.io/github/v/release/Shubhdeep12/resend-cli)](https://github.com/Shubhdeep12/resend-cli/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Full API coverage:** emails, domains, contacts, broadcasts, webhooks, keys, segments, topics, templates
- **Script & CI ready:** `--json`, pagination, consistent exit codes
- **Flexible auth:** named keys, `RESEND_API_KEY`, completions
- **Agent-friendly:** [behavior contract](./docs/AGENTS.md) for deterministic output

## Install

```bash
npm install -g @shubhdeep12/resend-cli
npx @shubhdeep12/resend-cli --help
```

No Node? [Download the latest binary](https://github.com/Shubhdeep12/resend-cli/releases/latest) for your OS, extract, and run.

## Quick Start

```bash
# Authenticate once
resend auth login

# Send an email
resend emails send --from "you@yourdomain.com" --to "user@example.com" --subject "Hi" --html "<p>Hello!</p>"

# List recent emails as JSON
resend emails list --json --limit 5

# Use an env var instead of login
RESEND_API_KEY="re_xxx" resend emails list --json
```

## Documentation

- [Commands](./docs/COMMANDS.md)
- [Agents](./docs/AGENTS.md)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, testing, and release workflow.

## License

MIT © [Shubhdeep](https://github.com/Shubhdeep12)
