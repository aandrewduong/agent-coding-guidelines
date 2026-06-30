#!/usr/bin/env node
// Single source of truth for the agent coding guidelines.
//
// Section bodies live in src/sections/*.md. This script packages them into the
// per-tool files each agent expects, so the wording is authored once and stays
// in sync everywhere:
//   - Claude Code: .claude/CLAUDE.md (always-on) + .claude/rules/*.md (path-scoped)
//   - Cursor:      .cursor/rules/*.mdc (alwaysApply for general, globs for scoped)
//   - Codex / AGENTS.md: .codex/AGENTS.md and ./AGENTS.md (everything inlined)
//
// Run `npm run generate` to write the files, or `npm run check` to fail when the
// committed files have drifted from the sources (used in CI).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SECTIONS_DIR = join(ROOT, "src", "sections");

const BANNER =
  "<!-- GENERATED FILE — do not edit directly. Edit src/sections/*.md and run `npm run generate`. -->";

// General sections load on every turn, in this order.
const GENERAL_SECTIONS = [
  { slug: "how-to-work", title: "How to Work" },
  { slug: "general-style", title: "General Style" },
  { slug: "reusability", title: "Reusability" },
  { slug: "architecture", title: "Architecture" },
  { slug: "no-shortcuts", title: "No Shortcuts" },
  { slug: "error-handling", title: "Error Handling" },
  { slug: "dependencies", title: "Dependencies" },
  { slug: "security", title: "Security" },
  { slug: "git-and-pull-requests", title: "Git and Pull Requests" },
];

// Scoped sections load only when the agent touches a matching file. The same
// glob list feeds Claude's `paths:` and Cursor's `globs:`.
const SCOPED_SECTIONS = [
  {
    slug: "typescript",
    title: "TypeScript",
    globs: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
  },
  {
    slug: "react",
    title: "React / Frontend",
    globs: ["**/*.tsx", "**/*.jsx", "**/components/**", "**/hooks/**"],
  },
  {
    slug: "testing",
    title: "Testing",
    globs: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**", "**/tests/**", "**/test/**"],
  },
];

const CLAUDE_INTRO =
  "The sections below are always loaded. Topic-specific rules (TypeScript, React, testing) live in `.claude/rules/` and load when Claude reads or works with files matching their `paths:` globs.";
const CURSOR_INTRO =
  "The sections below are always loaded. Topic-specific rules (TypeScript, React, testing) live in `.cursor/rules/` and are attached by Cursor when files match their `globs`.";

const heading = (level, title, body) => `${"#".repeat(level)} ${title}\n\n${body}`;
const frontmatter = (lines) => `---\n${lines.join("\n")}\n---`;
const document = (parts) => parts.join("\n\n") + "\n";

function buildClaudeMain(bodies) {
  const sections = GENERAL_SECTIONS.map((s) => heading(2, s.title, bodies[s.slug]));
  return document([BANNER, heading(1, "Coding Guidelines", CLAUDE_INTRO), ...sections]);
}

function buildClaudeRule(section, body) {
  const fm = frontmatter(["paths:", ...section.globs.map((glob) => `  - "${glob}"`)]);
  return document([fm, BANNER, heading(1, section.title, body)]);
}

function buildCursorMain(bodies) {
  const fm = frontmatter(["alwaysApply: true"]);
  const sections = GENERAL_SECTIONS.map((s) => heading(2, s.title, bodies[s.slug]));
  return document([fm, BANNER, heading(1, "Coding Guidelines", CURSOR_INTRO), ...sections]);
}

function buildCursorRule(section, body) {
  const fm = frontmatter([`globs: "${section.globs.join(", ")}"`, "alwaysApply: false"]);
  return document([fm, BANNER, heading(1, section.title, body)]);
}

function buildCombined(bodies) {
  const general = GENERAL_SECTIONS.map((s) => heading(2, s.title, bodies[s.slug]));
  const scoped = SCOPED_SECTIONS.map((s) => heading(2, s.title, bodies[s.slug]));
  return document([BANNER, "# Coding Guidelines", ...general, ...scoped]);
}

function planFiles(bodies) {
  const files = new Map();
  files.set(".claude/CLAUDE.md", buildClaudeMain(bodies));
  files.set(".cursor/rules/coding-guidelines.mdc", buildCursorMain(bodies));
  for (const section of SCOPED_SECTIONS) {
    files.set(`.claude/rules/${section.slug}.md`, buildClaudeRule(section, bodies[section.slug]));
    files.set(`.cursor/rules/${section.slug}.mdc`, buildCursorRule(section, bodies[section.slug]));
  }
  // Codex has no path-scoping, so it gets one file with everything inlined. The
  // project root copy is what AGENTS.md-aware agents discover by walking up.
  const combined = buildCombined(bodies);
  files.set(".codex/AGENTS.md", combined);
  files.set("AGENTS.md", combined);
  return files;
}

async function readBodies() {
  const sections = [...GENERAL_SECTIONS, ...SCOPED_SECTIONS];
  const entries = await Promise.all(
    sections.map(async ({ slug }) => {
      const body = await readFile(join(SECTIONS_DIR, `${slug}.md`), "utf8");
      return [slug, body.trim()];
    }),
  );
  return Object.fromEntries(entries);
}

async function writeFiles(files) {
  for (const [relPath, content] of files) {
    const absPath = join(ROOT, relPath);
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, content, "utf8");
  }
  console.log(`Generated ${files.size} files from src/sections/.`);
}

async function checkFiles(files) {
  const drifted = [];
  for (const [relPath, content] of files) {
    const current = await readFile(join(ROOT, relPath), "utf8").catch(() => null);
    if (current !== content) drifted.push(relPath);
  }
  if (drifted.length > 0) {
    console.error("Generated files are out of date. Run `npm run generate`:");
    for (const path of drifted) console.error(`  - ${path}`);
    process.exit(1);
  }
  console.log(`All ${files.size} generated files are up to date.`);
}

async function main() {
  const bodies = await readBodies();
  const files = planFiles(bodies);
  if (process.argv.includes("--check")) {
    await checkFiles(files);
  } else {
    await writeFiles(files);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
