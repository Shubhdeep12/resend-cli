# Contributing

Thanks for your interest in contributing to Resend CLI! This guide covers setup, development workflow, and release process.

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** (package manager)

## Setup

```bash
git clone https://github.com/shubhdeep12/resend-cli.git
cd resend-cli
pnpm install
```

## Development

```bash
# Watch mode — rebuilds on every change
pnpm dev

# Run the local build
node dist/index.mjs --help
```

## Code Quality

```bash
# Lint (Biome)
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Type-check
pnpm typecheck
```

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

Tests live in `tests/` and use [Vitest](https://vitest.dev) with `vitest-fetch-mock` for HTTP mocking.

## Documentation

Command reference docs are **auto-generated** from CLI `--help` output:

```bash
# Regenerate docs/COMMANDS.md
pnpm docs:generate

# Check if docs are up to date (useful in CI)
pnpm docs:check
```

> **Important:** If you add or change a command, run `pnpm docs:generate` before opening a PR.

## Project Structure

```
src/
├── app.ts              # Application root & route map
├── index.ts            # Entry point
├── commands/           # Command definitions (one file per resource)
├── lib/
│   ├── auth/           # API key storage & resolution
│   ├── config/         # CLI configuration
│   ├── constants/      # Shared constants
│   ├── formatters/     # Table & output formatting
│   ├── types/          # Shared TypeScript types
│   └── validators/     # Zod schemas for input validation
tests/                  # Unit tests (mirrors src/ structure)
docs/                   # Generated & manual documentation
scripts/                # Doc generation & tooling scripts
```

## Commit Messages

This project uses [Changesets](https://github.com/changesets/changesets) for versioning. When your change is user-facing:

```bash
pnpm changeset
```

Follow the prompts to describe your change and select a semver bump.

## Pull Request Checklist

- [ ] Code passes `pnpm lint` and `pnpm typecheck`
- [ ] Tests pass (`pnpm test`)
- [ ] Docs regenerated if commands changed (`pnpm docs:generate`)
- [ ] Changeset added for user-facing changes (`pnpm changeset`)

## Release

Maintainers only:

```bash
pnpm release
```

This versions packages, commits, pushes, and publishes to npm.
