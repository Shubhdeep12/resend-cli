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

**npm** (Node.js required):

```bash
npm install -g @shubhdeep12/resend-cli
npx @shubhdeep12/resend-cli --help
```

**macOS / Linux** (standalone binary via curl):

```bash
curl -fsSL https://raw.githubusercontent.com/Shubhdeep12/resend-cli/main/scripts/install.sh | bash
```

**Homebrew** (macOS):

```bash
brew install https://raw.githubusercontent.com/Shubhdeep12/resend-cli/main/Formula/resend-cli.rb
```

Or with Node already from Homebrew: `brew install node` then `npm install -g @shubhdeep12/resend-cli`.

**Windows** (PowerShell, standalone binary):

```powershell
irm https://raw.githubusercontent.com/Shubhdeep12/resend-cli/main/scripts/install.ps1 | iex
```

**Manual:** No Node? [Download the latest binary](https://github.com/Shubhdeep12/resend-cli/releases/latest) for your OS/arch, extract, and run.

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

## Authentication

The CLI needs a Resend API key. It is resolved in this order:

1. **`RESEND_API_KEY`** — Set in the environment or in a `.env` file in the current working directory. If set, this is always used.
2. **Saved key** — From `resend auth login` (or `resend auth select`). Used only when `RESEND_API_KEY` is not set.

So: **env (or `.env`) overrides saved keys.** Put `RESEND_API_KEY=re_xxx` in `.env` or export it; run from the directory that contains `.env` if you use a file.

## Documentation

- [Commands](./docs/COMMANDS.md)
- [Agents](./docs/AGENTS.md)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, testing, and release workflow.

## License

MIT © [Shubhdeep](https://github.com/Shubhdeep12)
