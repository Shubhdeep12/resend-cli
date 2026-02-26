#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const distCli = path.join(repoRoot, "dist", "index.mjs");
const outFile = path.join(repoRoot, "docs", "COMMANDS.md");
const checkMode = process.argv.includes("--check");

if (!fs.existsSync(distCli)) {
  console.error("dist/index.mjs not found. Run `pnpm run build` first.");
  process.exit(1);
}

function runHelp(args) {
  const result = spawnSync("node", [distCli, ...args, "--help"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `Help command failed: resend ${args.join(" ")} --help\n${result.stderr || result.stdout}`,
    );
  }
  return result.stdout;
}

function parseHelp(text) {
  const lines = text.split(/\r?\n/);
  const sections = { USAGE: [], FLAGS: [], COMMANDS: [] };
  let mode = null;

  for (const raw of lines) {
    const line = raw.replace(/\s+$/g, "");
    if (line === "USAGE" || line === "FLAGS" || line === "COMMANDS") {
      mode = line;
      continue;
    }
    if (!line.trim()) {
      mode = null;
      continue;
    }
    if (mode) sections[mode].push(line);
  }

  const commandItems = sections.COMMANDS.map((line) => {
    const parts = line.trim().split(/\s{2,}/);
    return { name: parts[0], brief: parts.slice(1).join(" ") || "" };
  }).filter((c) => c.name);

  const usage = sections.USAGE.map((l) => l.trim());
  const flags = sections.FLAGS.map((l) => l.trim());

  const descLine = lines.find((line) => {
    const t = line.trim();
    return (
      t &&
      t !== "USAGE" &&
      t !== "FLAGS" &&
      t !== "COMMANDS" &&
      !t.startsWith("resend ") &&
      !t.startsWith("-")
    );
  });

  return {
    description: descLine?.trim() || "",
    usage,
    flags,
    commands: commandItems,
  };
}

function collectTree(pathParts = []) {
  const help = parseHelp(runHelp(pathParts));
  const node = {
    pathParts,
    description: help.description,
    usage: help.usage,
    flags: help.flags,
    children: [],
  };

  for (const cmd of help.commands) {
    const childName = cmd.name;
    if (!childName || childName.startsWith("-")) continue;
    const child = collectTree([...pathParts, childName]);
    child.description = child.description || cmd.brief;
    node.children.push(child);
  }

  return node;
}

function flattenNodes(root) {
  const out = [];
  const walk = (node) => {
    out.push(node);
    for (const child of node.children) walk(child);
  };
  walk(root);
  return out;
}

function renderNode(node) {
  if (node.pathParts.length === 0) return "";

  const title = `## resend ${node.pathParts.join(" ")}`;
  const parts = [title, "", node.description || "No description.", ""];

  if (node.usage.length > 0) {
    parts.push("**Usage**", "", "```bash", ...node.usage, "```", "");
  }

  if (node.flags.length > 0) {
    parts.push("**Flags**", "", "```text", ...node.flags, "```", "");
  }

  if (node.children.length > 0) {
    parts.push("**Subcommands**", "");
    for (const child of node.children) {
      parts.push(
        `- \`${child.pathParts[child.pathParts.length - 1]}\`: ${child.description || ""}`,
      );
    }
    parts.push("");
  }

  return parts.join("\n");
}

const tree = collectTree([]);
const allNodes = flattenNodes(tree);

const generated = `${[
  "# Command Reference",
  "",
  "<!-- AUTO-GENERATED: run `pnpm docs:generate` -->",
  "",
  "This file is generated from CLI `--help` output.",
  "",
  ...allNodes
    .filter((node) => node.pathParts.length > 0)
    .map((node) => renderNode(node)),
]
  .join("\n")
  .trim()}\n`;

if (checkMode) {
  const current = fs.existsSync(outFile)
    ? fs.readFileSync(outFile, "utf8")
    : "";
  if (current !== generated) {
    console.error("docs/COMMANDS.md is out of date. Run `pnpm docs:generate`.");
    process.exit(1);
  }
  console.log("docs/COMMANDS.md is up to date.");
  process.exit(0);
}

fs.writeFileSync(outFile, generated, "utf8");
console.log(`Updated ${path.relative(repoRoot, outFile)}`);
