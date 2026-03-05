#!/usr/bin/env node
/**
 * Updates Formula/resend-cli.rb with current version and sha256 from the packed npm tarball.
 * Run during release (before or after publish); uses local pnpm pack so sha256 matches published tarball.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const pkgPath = path.join(repoRoot, "package.json");
const formulaPath = path.join(repoRoot, "Formula", "resend-cli.rb");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const { name: packageName, version } = pkg;

// npm tarball URL: https://registry.npmjs.org/@scope/name/-/name-version.tgz (unscoped name in filename)
const unscopedName = packageName.replace(/^@[^/]+\//, "");
const npmTarballUrl = `https://registry.npmjs.org/${packageName}/-/${unscopedName}-${version}.tgz`;

// Pack and get the tgz path (pnpm pack creates e.g. shubhdeep12-resend-cli-0.4.12.tgz)
const packResult = spawnSync("pnpm", ["pack"], { cwd: repoRoot, stdio: "inherit" });
if (packResult.status !== 0) {
  process.exit(1);
}

const expectedTgz = `${packageName.replace("@", "").replace("/", "-")}-${version}.tgz`;
const tgzPath = path.join(repoRoot, expectedTgz);
if (!fs.existsSync(tgzPath)) {
  console.error(`Expected tarball not found: ${tgzPath}`);
  process.exit(1);
}

const buf = fs.readFileSync(tgzPath);
const sha256 = createHash("sha256").update(buf).digest("hex");
fs.unlinkSync(tgzPath);

let formula = fs.readFileSync(formulaPath, "utf8");
formula = formula.replace(
  /  url "https:\/\/registry\.npmjs\.org\/[^"]+"/,
  `  url "${npmTarballUrl}"`,
);
formula = formula.replace(/  sha256 "[a-f0-9]+"/, `  sha256 "${sha256}"`);
fs.writeFileSync(formulaPath, formula, "utf8");

console.log(`Formula/resend-cli.rb updated: version=${version}, sha256=${sha256.slice(0, 16)}...`);
