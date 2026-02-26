# Agent Usage

Use JSON mode for deterministic output and parsing.

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
