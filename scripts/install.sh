#!/usr/bin/env bash
# Install resend-cli from GitHub Releases (macOS and Linux).
# Usage: curl -fsSL https://raw.githubusercontent.com/shubhdeep12/resend-cli/main/scripts/install.sh | bash
# Custom dir (optional): curl ... | bash -s -- -d /path/to/dir   or  INSTALL_DIR=/path bash -c "curl ... | bash"
set -euo pipefail

REPO="shubhdeep12/resend-cli"
INSTALL_DIR="${INSTALL_DIR:-}"

# Default: /usr/local/bin if writable, else ~/.local/bin (standard for user installs without sudo)
set_install_dir() {
  if [[ -n "${INSTALL_DIR}" ]]; then
    return
  fi
  if [[ -w /usr/local/bin ]] 2>/dev/null; then
    INSTALL_DIR="/usr/local/bin"
  else
    INSTALL_DIR="${HOME}/.local/bin"
  fi
}

detect_platform() {
  local os arch
  case "$(uname -s)" in
    Darwin)  os="darwin" ;;
    Linux)   os="linux" ;;
    *)
      echo "Unsupported OS: $(uname -s). Use npm: npm install -g @shubhdeep12/resend-cli" >&2
      exit 1
      ;;
  esac
  case "$(uname -m)" in
    x86_64|amd64) arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *)
      echo "Unsupported arch: $(uname -m). Use npm: npm install -g @shubhdeep12/resend-cli" >&2
      exit 1
      ;;
  esac
  echo "${os}-${arch}"
}

# Optional: -d /path (custom install directory)
while getopts "d:" opt; do
  case "$opt" in
    d) INSTALL_DIR="$OPTARG" ;;
    *) exit 1 ;;
  esac
done
# Expand ~ when user passes -d ~/something
if [[ -n "${INSTALL_DIR}" && "${INSTALL_DIR}" == ~* ]]; then
  INSTALL_DIR="${INSTALL_DIR/#\~/$HOME}"
fi

set_install_dir
mkdir -p "$INSTALL_DIR"
PLATFORM="$(detect_platform)"
echo "Installing resend-cli for ${PLATFORM} into ${INSTALL_DIR}"

# Fetch latest release tag and assets
API="https://api.github.com/repos/${REPO}/releases/latest"
if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required. Install curl or use: npm install -g @shubhdeep12/resend-cli" >&2
  exit 1
fi

JSON=$(curl -fsSL "$API")
TAG=$(echo "$JSON" | grep -o '"tag_name": *"[^"]*"' | head -1 | sed 's/"tag_name": *"\(.*\)"/\1/')
# Remove leading 'v' if present
VERSION="${TAG#v}"
# Find an asset matching this platform (allow .tar.gz, .zip, or raw binary name)
ASSET_NAME=$(echo "$JSON" | sed -n 's/.*"name": *"\([^"]*resend-cli-[^"]*'"${PLATFORM}"'[^"]*\)".*/\1/p' | head -1)
if [[ -z "$ASSET_NAME" ]]; then
  ASSET_NAME=$(echo "$JSON" | tr ',' '\n' | grep '"name"' | sed 's/.*"name": *"\([^"]*\)".*/\1/' | grep -F "$PLATFORM" | head -1)
fi

if [[ -z "$ASSET_NAME" ]]; then
  echo "No pre-built binary for ${PLATFORM} in this release." >&2
  echo "Install with Node.js: npm install -g @shubhdeep12/resend-cli" >&2
  echo "Or download manually: https://github.com/${REPO}/releases/latest" >&2
  exit 1
fi

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${TAG}/${ASSET_NAME}"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "Downloading ${ASSET_NAME}..."
curl -fsSL -o "$TMPDIR/$ASSET_NAME" "$DOWNLOAD_URL"

BINARY_DEST="$INSTALL_DIR/resend"
if [[ "$ASSET_NAME" == *.tar.gz ]]; then
  tar -xzf "$TMPDIR/$ASSET_NAME" -C "$TMPDIR"
  # Find the binary: exclude archives and checksum files (BSD find on macOS doesn't support -executable)
  EXE=$(find "$TMPDIR" -maxdepth 2 -type f \( -name "resend-cli-*" ! -name "*.tar.gz" ! -name "*.sha256" \) 2>/dev/null | head -1)
  if [[ -z "$EXE" ]]; then
    EXE=$(find "$TMPDIR" -maxdepth 2 -type f -executable 2>/dev/null | head -1)
  fi
  if [[ -z "$EXE" ]]; then
    echo "Could not find executable in tarball." >&2
    ls -la "$TMPDIR" >&2
    exit 1
  fi
  chmod +x "$EXE"
  cp "$EXE" "$BINARY_DEST"
elif [[ "$ASSET_NAME" == *.zip ]]; then
  unzip -q -o "$TMPDIR/$ASSET_NAME" -d "$TMPDIR"
  EXE=$(find "$TMPDIR" -maxdepth 2 -type f \( -name "resend-cli*" -o -name "resend*" \) ! -name "*.zip" ! -name "*.sha256" 2>/dev/null | head -1)
  if [[ -z "$EXE" ]]; then
    echo "Could not find executable in zip." >&2
    exit 1
  fi
  chmod +x "$EXE"
  cp "$EXE" "$BINARY_DEST"
else
  cp "$TMPDIR/$ASSET_NAME" "$BINARY_DEST"
  chmod +x "$BINARY_DEST"
fi

if [[ ! -f "$BINARY_DEST" || ! -x "$BINARY_DEST" ]]; then
  echo "Install failed: binary missing or not executable at $BINARY_DEST" >&2
  exit 1
fi

echo "Installed to $BINARY_DEST"
if command -v resend >/dev/null 2>&1; then
  resend --version
else
  echo "Run the following to use resend from anywhere (or add to your shell profile):"
  echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
  "$BINARY_DEST" --version
fi
