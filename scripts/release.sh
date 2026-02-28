#!/usr/bin/env bash
set -euo pipefail

pnpm run version-packages
node scripts/sync-skill-version.mjs
pnpm run lint:fix

git add -A

if git diff --staged --quiet; then
  echo "No release changes to commit (no changesets?). Aborting publish."
  exit 1
fi

git commit -m "chore: version packages"
git push
pnpm publish --access public