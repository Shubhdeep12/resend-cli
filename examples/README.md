# Resend CLI Examples

This folder contains practical examples demonstrating how to use the Resend CLI for various use cases.

## Quick Links

- [01 - Basic Email Usage](#01-basic-email) - Getting started with sending emails
- [02 - AI Agent Debugging](#02-ai-agent-debugging) - How AI agents can debug email issues
- [03 - CI/CD Integration](#03-cicd-integration) - Automate email testing in pipelines
- [04 - Monitoring & Alerts](#04-monitoring) - Email health monitoring patterns
- [05 - Bulk Operations](#05-bulk-operations) - Contact and broadcast management

## Authentication

All examples assume you've configured authentication using one of these methods:

### Method 1: Interactive Setup (Recommended for Development)
```bash
resend init
# Follow the prompts to enter your API key
```

### Method 2: Environment Variable (CI/CD)
```bash
export RESEND_API_KEY="re_your_api_key_here"
```

### Method 3: Inline (One-off Commands)
```bash
RESEND_API_KEY="re_xxx" resend emails list
```

## Why These Examples Matter

### For Developers 👨‍💻
- Quickly test email functionality during development
- Debug production email issues from the terminal
- Automate email-related tasks

### For AI Agents 🤖
- Claude Code, Cursor, and other coding agents can use these patterns
- All commands support `--json` for easy parsing
- Structured outputs enable automated debugging and monitoring

### For DevOps/SRE 🔧
- Monitor email health in scripts
- Integrate with alerting systems
- Automate domain verification and setup

## Example Categories

### 01 - Basic Email
Send emails with HTML, text, attachments, and scheduling.

### 02 - AI Agent Debugging
Use `--json` so AI agents can query logs and debug delivery issues.

### 03 - CI/CD Integration
Shell scripts for email testing in pipelines.

### 04 - Monitoring
Email metrics, bounce rates, and delivery health.

### 05 - Bulk Operations
Contacts, segments, and broadcast campaigns at scale.

## Full CLI surface

Beyond these examples, the CLI supports:

- **Emails**: batch send (JSON file/stdin), attachments list/get (sent and receiving), receiving list/get/forward
- **Contact properties, segments, topics**: full CRUD and pagination
- **Templates**: create (HTML / `--html-file`), list, get, update, remove, duplicate, publish
- **Pagination**: `--limit`, `--after <id>`, `--before <id>` on list commands (use only one of `--after` or `--before`)
- **JSON**: add `--json` to any command that returns data

Run `resend <group> --help` (e.g. `resend emails --help`, `resend templates --help`) for options.

## Contributing

Have a useful pattern? Create a pull request with your example!
