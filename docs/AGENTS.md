# Agent Usage

Use JSON mode for deterministic output and parsing.

## Obtaining the CLI

- **With Node.js:** `npm install -g @shubhdeep12/resend-cli` (or `npx @shubhdeep12/resend-cli` for one-off runs).
- **Without Node.js:** Download the latest standalone binary for your OS/arch from [GitHub Releases](https://github.com/Shubhdeep12/resend-cli/releases/latest). Assets are named e.g. `resend-cli-<version>-linux-x64.tar.gz`, `resend-cli-<version>-darwin-arm64.tar.gz`, `resend-cli-<version>-win-x64.zip`. Extract and run the executable; no runtime required.

## Recommended Pattern

```bash
export RESEND_API_KEY="re_xxx"
resend <group> <command> --json
```

## Behavior Contract

- Exit code `0` on success, non-zero on failure.
- `--json` returns a single JSON payload for data commands.
- Pagination on list commands: `--limit`, `--after`, `--before`.

## Suggested Flow

1. Run `resend --help` and `resend <group> --help`.
2. Prefer list/get calls with `--json`.
3. Parse errors from JSON `error` object where available.
