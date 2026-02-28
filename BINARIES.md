# Standalone binaries – exploration

Ways to build and distribute **resend-cli** so users **don’t need Node.js or npm**. This doc focuses on **where/when to build**, **where to store** artifacts, **which OS/arch** to support, and **what else** to consider. No implementation yet.

---

## Binary vs npm, and upgrade support

**You don’t have to choose “pkg OR Node packages.”** Do both.

| Distribution | Who it’s for | Upgrade path |
|--------------|--------------|--------------|
| **npm / pnpm package** (current) | Users who have Node.js; devs; CI that already has Node | Standard: `pnpm update -g @shubhdeep12/resend-cli` or `npm update -g ...`. No extra work. |
| **Standalone binaries** (pkg or SEA) | Users without Node; install scripts; Homebrew/Scoop | Re-download from Releases, or `resend upgrade` (see below), or `brew upgrade` / `scoop update` if you ship via those. |

**Recommendation:**

- **Keep publishing the npm package** as you do now. That gives you a single source of truth, semantic versioning, and the usual upgrade experience for anyone with Node.
- **Add standalone binaries** (via pkg or Node SEA) for users who don’t have Node and for package managers that expect a single executable. Build them in CI and attach to GitHub Releases (same version as the npm release).

So: **Node packages = primary, well-supported upgrade path; binaries = same version, different delivery for environments without Node.**

**Upgrade support for binary users:**

- **Manual:** “Download the latest from [Releases](link).”
- **In-CLI:** A `resend upgrade` (or `resend self-update`) command that checks the latest release (e.g. GitHub API), downloads the right binary for the current OS/arch from Releases, and replaces the running binary. Many CLIs do this.
- **Package managers:** If you add Homebrew Cask or Scoop later, they handle upgrades (`brew upgrade resend-cli`, `scoop update resend-cli`).

**pkg vs “only Node packages”:**

- **Only Node packages** = no standalone binary; users must have Node. Upgrades are great; you don’t support “no Node” users.
- **pkg (or SEA) in addition to npm** = same codebase, same versions; you ship both the npm package and binaries. Node users keep using npm; everyone else uses the binary. Upgrades: npm users use the normal tooling; binary users use re-download, `resend upgrade`, or a package manager.

So **pkg (or SEA) is the right way to get binary distribution and still keep the npm package and its upgrade story;** use both, not one instead of the other.

---

## Recommended approach for this repo: Node SEA

For **binaries**, prefer **Node SEA (Single Executable Applications)** over `pkg` here.

- **Why SEA**
  - **Official** Node.js feature (no third-party packager runtime)
  - Good long-term story for “production” distribution
  - Works well with “build in CI, attach to GitHub Releases”

- **What SEA requires**
  - SEA embeds **one bundled JavaScript file** into the Node binary.
  - That means we need a **bundle step** that outputs a single file (we can minify it).

- **Size / compression strategy (safe)**
  - SEA binaries are large because they include the Node runtime.
  - The safest size wins without breaking flow are:
    - **Bundle + minify** the embedded JS (reduces the embedded blob size)
    - Ship release assets as **compressed archives**:
      - macOS/Linux: `.tar.gz`
      - Windows: `.zip`
  - Avoid “aggressive” executable packers by default (e.g. UPX) because they can:
    - interfere with macOS/Windows signing,
    - trigger AV false positives on Windows,
    - be brittle across platforms.

---

## 1. Build in CI (when and how)

**Yes – building in CI is the right place.** You typically don’t want every developer to produce binaries locally; you want one canonical build per release.

- **When to run**
  - On **release**: when you cut a version (e.g. tag `v1.2.3` or “publish” in GitHub Releases).
  - Optionally on **every push to main** for “nightly” / `latest` binaries (less common for a CLI).
- **Where to run**
  - **GitHub Actions**: one workflow that runs on release (e.g. `release published` or `push tags: v*`).
  - **Matrix**: one job per target (see OS/arch below), or one job that runs a tool (e.g. pkg) with multiple `-t` targets.
- **What the job does**
  1. Checkout, install deps, run tests (optional but good).
  2. Build the app (`pnpm build`).
  3. Build binaries (pkg / SEA / nexe / etc.) for each target.
  4. Upload artifacts (see “Where to store” below).

So: **CI step = run binary build on release (and optionally nightly), store outputs as release artifacts.**

---

## 2. Where to store the binaries

You need a stable, public (or authenticated) place users and installers can download from.

| Option | Pros | Cons |
|--------|------|------|
| **GitHub Releases** | Built-in, free, versioned, supports multiple files per release; works great with Homebrew/Scoop | Need to trigger workflow on release/tag |
| **npm package** | Already using it; some users prefer `npm i -g`; can attach optional “optionalDependencies” for OS-specific binaries (advanced) | Not the primary way to ship “no Node” binaries; most people use Releases for binaries |
| **S3 / R2 / GCS bucket** | Full control, CDN, custom URLs | Extra setup, cost, and you must handle versioning/URLs yourself |
| **Docker registry** | Good if you also want a Docker image | Doesn’t replace the need for a place to put native binaries |

**Recommendation:** Use **GitHub Releases** as the canonical place:

- One release per version (e.g. `v0.4.3`).
- Attach one file per OS/arch (e.g. `resend-cli-0.4.3-darwin-arm64`, `resend-cli-0.4.3-linux-x64`, `resend-cli-0.4.3-win-x64.exe`).
- CI builds those files and uploads them as **Release assets** (e.g. with `softprops/action-gh-release` or the GitHub API).

That gives you stable URLs like:

`https://github.com/shubhdeep12/resend-cli/releases/download/v0.4.3/resend-cli-0.4.3-darwin-arm64`

which you can use in Homebrew Cask, Scoop, install scripts, and docs.

---

## 3. Different OS and architectures

Binaries are **platform-specific**: a binary built on Linux won’t run on macOS or Windows. So you build **one binary per (OS, arch)** you want to support.

**Typical matrix:**

| OS | Architectures | Notes |
|----|----------------|--------|
| **macOS** (darwin) | `arm64` (Apple Silicon), `x64` (Intel) | Two binaries; consider `.tar.gz` or plain executable |
| **Linux** | `x64`, `arm64` | Most servers and ARM devices; add `arm` (32-bit) if you need older Pis |
| **Windows** | `x64`, optionally `arm64` | `.exe`; often one x64 is enough to start |

So at minimum you’d have something like:

- `resend-cli-<version>-darwin-arm64`
- `resend-cli-<version>-darwin-x64`
- `resend-cli-<version>-linux-x64`
- `resend-cli-<version>-linux-arm64`
- `resend-cli-<version>-win-x64.exe`

**In CI:**

- **Option A:** Single runner (e.g. Ubuntu) and a tool that supports **cross-compilation** (e.g. `@yao-pkg/pkg` with `-t node20-darwin-arm64,node20-darwin-x64,...`) so one job produces all files.
- **Option B:** **Matrix strategy** (e.g. `runs-on: [ubuntu-latest, macos-latest, windows-latest]` and possibly more for arm64) and build only the native binary per job; then collect all artifacts and attach them to the same Release.

A is simpler (one job, one place to configure); B is useful if the tool doesn’t cross-compile well (e.g. Node SEA often needs a native build per platform).

---

## 4. What else to consider

- **Naming**
  - Consistent names and extensions: e.g. `resend-cli-<version>-<os>-<arch>` with `.exe` on Windows. Makes it easy to script and document.

- **Version in filename**
  - Include the version (e.g. `0.4.3`) so multiple versions can sit in the same directory and installers can pick the right one.

- **Checksums**
  - Publish `SHA256SUMS` (and optionally SHA512) next to the binaries so install scripts and power users can verify integrity. CI can generate these after building.

- **Signing (optional but good for trust)**
  - **macOS:** Sign the binary (e.g. `codesign`); required for Gatekeeper if you want to avoid “unidentified developer” warnings. Often done in CI with a cert.
  - **Windows:** Sign the `.exe` with Authenticode so SmartScreen doesn’t block. Optional but improves trust.

- **Node version embedded**
  - For pkg/SEA, you’re effectively freezing a Node version (e.g. 20). Document “built with Node 20” and plan upgrades when you bump the embedded runtime.

- **Release notes**
  - On GitHub Releases, add a short changelog and list the attached binaries (and checksums) so users know what to download.

- **Install instructions**
  - In README: “Download from Releases” + table (OS | Arch | Download link). Optionally add one-line install script that picks OS/arch and downloads the right file (e.g. `curl -fsSL ... | sh`).

- **Package managers later**
  - **Homebrew Cask / Scoop:** Formula/manifest that points at the GitHub Release URL for the right asset. No need to host binaries elsewhere.

---

## Summary

| Topic | Recommendation |
|-------|----------------|
| **Binary vs npm** | **Both:** keep the npm package (upgrades via `pnpm update -g` etc.); add standalone binaries (pkg or SEA) for users without Node. Same version, two delivery channels. |
| **When** | Build in **CI on release** (e.g. when a version is published or a tag is pushed). |
| **Where to store** | **GitHub Releases** – attach one artifact per OS/arch; use stable release URLs for installers and docs. |
| **OS/arch** | At least **darwin (arm64, x64), linux (x64, arm64), windows (x64)**; add more if you need them. |
| **What else** | Consistent naming, version in filename, checksums, optional signing (macOS/Windows), document Node version, release notes, and install instructions. For binary users’ upgrades: re-download, optional `resend upgrade` command, or Homebrew/Scoop. |

Next step when you’re ready: pick a **binary build method** (e.g. pkg vs SEA vs nexe), then add a **single CI workflow** that builds those targets and uploads them to GitHub Releases.
