#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: "inherit",
    ...opts,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
  }
}

function exists(cmd) {
  const which = process.platform === "win32" ? "where" : "command";
  const args = process.platform === "win32" ? [cmd] : ["-v", cmd];
  const r = spawnSync(which, args, { cwd: repoRoot, stdio: "ignore" });
  return r.status === 0;
}

function platformSuffix() {
  const plat =
    process.platform === "darwin"
      ? "darwin"
      : process.platform === "win32"
        ? "win"
        : "linux";
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return `${plat}-${arch}`;
}

const pkg = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
);
const version = pkg.version;

const outDir = path.join(repoRoot, "dist", "sea");
const bundlePath = path.join(outDir, "resend-cli.bundle.cjs");
const seaConfigPath = path.join(outDir, "sea-config.json");
const blobPath = path.join(outDir, "sea-prep.blob");
const binDir = path.join(repoRoot, "bin");
const outBase = `resend-cli-${version}-${platformSuffix()}`;
const outExePath =
  process.platform === "win32"
    ? path.join(binDir, `${outBase}.exe`)
    : path.join(binDir, outBase);

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(binDir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(repoRoot, "src", "index.ts")],
  outfile: bundlePath,
  bundle: true,
  platform: "node",
  format: "cjs",
  target: ["node20"],
  minify: true,
  sourcemap: false,
  logLevel: "info",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

fs.writeFileSync(
  seaConfigPath,
  JSON.stringify(
    { main: bundlePath, output: blobPath, disableExperimentalSEAWarning: true },
    null,
    2,
  ),
  "utf8",
);

run(process.execPath, ["--experimental-sea-config", seaConfigPath]);

fs.copyFileSync(process.execPath, outExePath);

// macOS: remove existing signature before injection (best-effort)
if (process.platform === "darwin" && exists("codesign")) {
  spawnSync("codesign", ["--remove-signature", outExePath], {
    cwd: repoRoot,
    stdio: "ignore",
  });
}

const fuse = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";
const postjectArgs = [
  "exec",
  "postject",
  outExePath,
  "NODE_SEA_BLOB",
  blobPath,
  "--sentinel-fuse",
  fuse,
];

if (process.platform === "darwin") {
  postjectArgs.push("--macho-segment-name", "NODE_SEA");
}

run("pnpm", postjectArgs);

// macOS: ad-hoc sign so Gatekeeper is happier (optional, best-effort)
if (process.platform === "darwin" && exists("codesign")) {
  spawnSync("codesign", ["--sign", "-", "--force", outExePath], {
    cwd: repoRoot,
    stdio: "ignore",
  });
}

// Windows/Linux: optional strip. Avoid doing this on macOS because it can conflict with signing.
if (process.platform !== "darwin") {
  const stripCmd = process.platform === "win32" ? null : "strip";
  if (stripCmd && exists(stripCmd)) {
    spawnSync(stripCmd, [outExePath], { cwd: repoRoot, stdio: "ignore" });
  }
}

console.log(
  `SEA binary created: ${path.relative(repoRoot, outExePath)} (${(
    fs.statSync(outExePath).size /
    (1024 * 1024)
  ).toFixed(1)} MiB)`,
);

// Write a small build metadata file (useful for CI logs and debugging).
const meta = {
  version,
  platform: process.platform,
  arch: process.arch,
  node: process.version,
  builtAt: new Date().toISOString(),
  output: outExePath,
  bundle: bundlePath,
  blob: blobPath,
  tmp: os.tmpdir(),
};
fs.writeFileSync(
  path.join(outDir, `build-meta-${platformSuffix()}.json`),
  JSON.stringify(meta, null, 2),
  "utf8",
);
