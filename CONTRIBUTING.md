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
│   ├── package-identity.js  # Single source: package name, version, registry URL (from package.json; see package-identity.ts)
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

**Package name and version:** `package.json` is the single source of truth. Runtime code uses `src/lib/package-identity.ts`. Install scripts are updated during release by:

- `scripts/sync-skill-version.mjs` — updates `SKILL.md` version
- `scripts/sync-repo-slug.mjs` — updates repo slug in `install.sh` / `install.ps1` from `repository.url`

## Commit Messages

This project uses [Changesets](https://github.com/changesets/changesets) for versioning. When your change is user-facing:

```bash
pnpm changeset
```

Follow the prompts to describe your change and select a semver bump.

## Pull Request Guidelines

Before opening a PR, run these locally. CI will run the same steps on every PR.

| Step | Command | Required |
|------|---------|----------|
| Lint | `pnpm lint` | Yes |
| Typecheck | `pnpm typecheck` | Yes |
| Tests | `pnpm test` | Yes |
| Coverage | `pnpm test:coverage` | Yes (must meet thresholds) |
| Changeset | `pnpm changeset` | Yes, for user-facing changes |

**Checklist**

- [ ] Code passes `pnpm lint` and `pnpm typecheck`
- [ ] Tests pass (`pnpm test`) and coverage passes (`pnpm test:coverage`)
- [ ] Install paths verified: `pnpm test:install` (curl stub, npm build, SEA binary)
- [ ] Docs regenerated if commands changed (`pnpm docs:generate`)
- [ ] Changeset added for user-facing changes (`pnpm changeset`)

## Testing install methods

**Before release**, run: `pnpm test:install` (curl stub → resend -v, npm build → resend -v, SEA binary). Optional e2e: `RUN_E2E=1 pnpm test:install`. Manual checks when you change install scripts:

**Prerequisites:** A GitHub release with binaries (e.g. run the “Release Binaries” workflow and attach assets to a tag). The install scripts fetch the **latest** release from the GitHub API.

### 1. curl (macOS / Linux)

From a **different directory** (so you don’t run the repo’s own binary):

```bash
# Install into default location (/usr/local/bin or ~/.local/bin)
curl -fsSL https://raw.githubusercontent.com/Shubhdeep12/resend-cli/main/scripts/install.sh | bash

# Or install into a test dir (no sudo)
curl -fsSL https://raw.githubusercontent.com/Shubhdeep12/resend-cli/main/scripts/install.sh | bash -s -- -d /tmp/resend-cli-test
export PATH="/tmp/resend-cli-test:$PATH"
resend --version
resend --help
```

If there is no release with binaries for your platform, the script will exit with a message to use npm instead.

### 2. Windows (PowerShell)

In PowerShell (e.g. in a VM or CI):

```powershell
# Default install dir: $env:LOCALAPPDATA\Programs\resend-cli
irm https://raw.githubusercontent.com/Shubhdeep12/resend-cli/main/scripts/install.ps1 | iex

# Or with a custom dir
$env:InstallDir = "C:\Tools\resend-cli"
irm https://raw.githubusercontent.com/Shubhdeep12/resend-cli/main/scripts/install.ps1 | iex
resend --version
```

**Note:** The curl and PowerShell installers need **GitHub Releases with assets**. If the latest release has no assets, they tell the user to use npm.

## Release

Maintainers only:

```bash
pnpm release
```

This versions packages, commits, pushes, and publishes to npm.
