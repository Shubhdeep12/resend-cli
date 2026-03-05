#!/usr/bin/env node
/**
 * Updates repo slug in install scripts from package.json repository.url.
 * Keeps scripts/install.sh and scripts/install.ps1 in sync with the canonical repo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const pkgPath = path.join(repoRoot, "package.json");
const installShPath = path.join(repoRoot, "scripts", "install.sh");
const installPs1Path = path.join(repoRoot, "scripts", "install.ps1");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const url = pkg.repository?.url ?? "";
const match = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/i.exec(url);
const slug = match ? match[1] : "Shubhdeep12/resend-cli";

function updateInstallSh(content) {
  return content
    .replace(/REPO="[^"]+"/, `REPO="${slug}"`)
    .replace(
      /https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\//,
      `https://raw.githubusercontent.com/${slug}/`,
    );
}

function updateInstallPs1(content) {
  return content
    .replace(/\$Repo = "[^"]+"/, `$Repo = "${slug}"`)
    .replace(
      /https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\//,
      `https://raw.githubusercontent.com/${slug}/`,
    );
}

fs.writeFileSync(installShPath, updateInstallSh(fs.readFileSync(installShPath, "utf8")), "utf8");
fs.writeFileSync(installPs1Path, updateInstallPs1(fs.readFileSync(installPs1Path, "utf8")), "utf8");
console.log(`Install scripts updated: repo slug = ${slug}`);