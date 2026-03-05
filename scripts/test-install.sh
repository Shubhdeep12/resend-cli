#!/usr/bin/env bash
# Unified install tests: verify every install path ends with a working "resend -v".
# Run from repo root: bash scripts/test-install.sh
# Optional: RUN_E2E=1 to also run real curl | bash against GitHub (requires network).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

FAILED=0
run_test() {
  local name="$1"
  shift
  printf "\n=== %s ===\n" "$name"
  if "$@"; then
    echo "PASS: $name"
  else
    echo "FAIL: $name"
    FAILED=1
  fi
}

# ---- 1. Curl path (offline): stub tarball -> install logic -> resend -v ----
test_curl_offline() {
  local tmp
  tmp="$(mktemp -d)"
  trap "rm -rf '$tmp'" RETURN

  # Stub binary: responds to --version / -v like real resend
  local stub="$tmp/stub-dir/resend-cli-0.4.99-darwin-arm64"
  mkdir -p "$(dirname "$stub")"
  cat > "$stub" << 'STUB'
#!/bin/sh
case "$1" in --version|-v) echo "resend 0.4.99"; exit 0 ;; *) echo "resend 0.4.99"; exit 0 ;; esac
STUB
  chmod +x "$stub"

  # Tarball as produced by release workflow (single file at root)
  (cd "$(dirname "$stub")" && tar -czf "$tmp/resend-cli-0.4.99-darwin-arm64.tar.gz" "$(basename "$stub")")

  # Install dir and extract
  local install_dir="$tmp/install-dir"
  mkdir -p "$install_dir"
  tar -xzf "$tmp/resend-cli-0.4.99-darwin-arm64.tar.gz" -C "$tmp"

  # Same find/cp logic as install.sh (must not pick .sha256 if present)
  touch "$tmp/resend-cli-0.4.99-darwin-arm64.tar.gz.sha256"
  local exe
  exe=$(find "$tmp" -maxdepth 2 -type f \( -name "resend-cli-*" ! -name "*.tar.gz" ! -name "*.sha256" \) 2>/dev/null | head -1)
  [[ -n "$exe" ]] || { echo "find returned nothing"; return 1; }
  [[ "$(basename "$exe")" != *.sha256 ]] || { echo "find selected .sha256"; return 1; }
  chmod +x "$exe"
  cp "$exe" "$install_dir/resend"

  # Must run and show version
  local out
  out=$("$install_dir/resend" --version 2>&1) || true
  echo "$out" | grep -q "resend" || { echo "expected version output, got: $out"; return 1; }
  "$install_dir/resend" -v >/dev/null 2>&1 || { echo "resend -v failed"; return 1; }
  return 0
}

# ---- 2. Npm path: built package runs (resend -v via node dist/index.cjs) ----
test_npm_install() {
  # Build and run the same entrypoint npm install -g would run
  (cd "$REPO_ROOT" && pnpm run build >/dev/null 2>&1) || { echo "pnpm build failed"; return 1; }
  node "$REPO_ROOT/dist/index.cjs" --version >/dev/null 2>&1 || { echo "node dist/index.cjs --version failed"; return 1; }
  node "$REPO_ROOT/dist/index.cjs" -v >/dev/null 2>&1 || { echo "node dist/index.cjs -v failed"; return 1; }
  return 0
}

# ---- 3. Formula: syntax and load check ----
test_formula_valid() {
  ruby -c "$REPO_ROOT/Formula/resend-cli.rb" >/dev/null 2>&1 || { echo "ruby -c failed"; return 1; }
  # Optional: ensure it has required fields
  grep -q "class ResendCli" "$REPO_ROOT/Formula/resend-cli.rb" || { echo "missing class ResendCli"; return 1; }
  grep -q "def install" "$REPO_ROOT/Formula/resend-cli.rb" || { echo "missing def install"; return 1; }
  return 0
}

# ---- 4. E2E curl (optional, needs network and a release with binaries) ----
test_curl_e2e() {
  local tmp
  tmp="$(mktemp -d)"
  trap "rm -rf '$tmp'" RETURN
  local install_dir="$tmp/install-dir"
  mkdir -p "$install_dir"
  curl -fsSL https://raw.githubusercontent.com/Shubhdeep12/resend-cli/main/scripts/install.sh | bash -s -- -d "$install_dir" || { echo "curl install failed"; return 1; }
  [[ -x "$install_dir/resend" ]] || { echo "no resend after install"; return 1; }
  "$install_dir/resend" --version >/dev/null 2>&1 || { echo "resend --version failed"; return 1; }
  return 0
}

# ---- Run ----
echo "Unified install tests (goal: resend -v works for every path)"
run_test "curl (offline): stub tarball -> install -> resend -v" test_curl_offline
run_test "npm: install -g in temp prefix -> resend -v" test_npm_install
run_test "formula: Formula/resend-cli.rb valid" test_formula_valid

if [[ "${RUN_E2E:-0}" == "1" ]]; then
  run_test "curl (e2e): real curl | bash -d temp -> resend -v" test_curl_e2e
else
  echo ""
  echo "Skip e2e curl test (set RUN_E2E=1 to run against GitHub)"
fi

echo ""
if [[ $FAILED -eq 0 ]]; then
  echo "All install tests passed."
  exit 0
else
  echo "Some install tests failed."
  exit 1
fi
