#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const pkgPath = path.join(repoRoot, "package.json");
const skillPath = path.join(repoRoot, "SKILL.md");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const version = pkg.version;

let skill = fs.readFileSync(skillPath, "utf8");
skill = skill.replace(/^(\s*version:\s*)["'][^"']+["']/m, `$1"${version}"`);
fs.writeFileSync(skillPath, skill, "utf8");
console.log(`SKILL.md metadata.version set to ${version}`);
