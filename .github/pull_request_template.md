## Description

<!-- What does this PR do? -->

## PR guidelines

CI will run the following. Please ensure they pass locally before requesting review:

- [ ] **Lint** — `pnpm lint`
- [ ] **Typecheck** — `pnpm typecheck`
- [ ] **Tests** — `pnpm test`
- [ ] **Coverage** — `pnpm test:coverage` (must meet thresholds)
- [ ] **Changeset** — `pnpm changeset` (for user-facing changes only)

If you added or changed a command, run `pnpm docs:generate` and commit the updated `docs/COMMANDS.md`.
