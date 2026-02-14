# Tests

Unit tests only. Layout mirrors `src/`: `lib/` for lib modules, `commands/` for CLI commands, `app.spec.ts` for app-level (help, version).

## Running tests

```bash
pnpm test           # all tests (mocked fetch, no real API calls)
pnpm test:coverage  # with coverage
pnpm test:watch     # watch mode
```

## Structure

| Path | Purpose |
|------|--------|
| `tests/test-utils/` | Helpers, fetch mock, CLI mocks (config + prompts). |
| `tests/lib/*.spec.ts` | Unit tests for `src/lib` (config, output, api). |
| `tests/commands/*.spec.ts` | One file per command; mocked API. |
| `tests/app.spec.ts` | Help, version, unknown command (runs built CLI). |

## Adding tests

- **New command**: Add `tests/commands/<name>.spec.ts`. Import `../test-utils/cli-mocks.js` first, then `#/app.js`, then `runApp` / `runAppWithOutput` and `mockSuccessResponse` (or `mockErrorResponse`). One `it()` per subcommand; assert URL, method, body, and output.
- **New lib module**: Add `tests/lib/<module>.spec.ts` and import from `#/lib/<module>.js`.
