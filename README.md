# Resend CLI

Unofficial CLI for [Resend](https://resend.com)

[![npm version](https://img.shields.io/npm/v/@shubhdeep12/resend-cli.svg)](https://www.npmjs.com/package/@shubhdeep12/resend-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Full API coverage** — emails, domains, contacts, broadcasts, webhooks, keys, segments, topics, templates, and more
- **Script & CI ready** — `--json` flag on every command, pagination, and consistent exit codes
- **Flexible auth** — named key profiles, env var override (`RESEND_API_KEY`), shell completions
- **Agent-friendly** — deterministic output with a documented [behavior contract](./docs/AGENTS.md)

## Install

```bash
npm install -g @shubhdeep12/resend-cli
# or try without installing
npx @shubhdeep12/resend-cli --help
```

## Updating

```bash
# Update the globally installed CLI
npm install -g @shubhdeep12/resend-cli

# or, with pnpm
pnpm add -g @shubhdeep12/resend-cli
```

The CLI periodically checks npm for a newer version and prints a notice when one is available. To disable this check for a single run, pass `--no-check-version`, or set `RESEND_CLI_NO_VERSION_CHECK=1` to disable it via environment variable.

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

- [Command Reference](./docs/COMMANDS.md) — auto-generated from `--help` output
- [Agent Usage](./docs/AGENTS.md) — integration guide for AI agents and scripts

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, testing, and release workflow.

## License

MIT © [Shubhdeep](https://github.com/Shubhdeep12)
