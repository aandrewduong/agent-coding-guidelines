# Agent Coding Guidelines

Without proper guidelines, AI coding agents default to generating slop code: code that compiles, passes tests, and quietly accumulates technical debt that future developers (or future you) have to clean up.

It's like handing a toddler a hammer and saying "go build a house." The hammer works. The toddler is enthusiastic. The house is not up to code.

AI gets smarter with each model release, but smarter without guidance just means it builds *bigger* broken houses, *faster*. Capability without direction amplifies the mess. A good set of Cursor Project Rules, a `CLAUDE.md`, or an `AGENTS.md` is the blueprint that turns raw capability into maintainable code.

Drop-in Cursor Project Rules, `CLAUDE.md`, and `AGENTS.md` files for AI coding agents (Cursor, Claude Code, OpenAI Codex CLI) that enforce basic engineering principles: reusability, no magic strings, no `any` in TypeScript, no god classes, clean entry points, and meaningful comments only.

> **Heads up:** This repo is **my personal coding guidelines.** It reflects how *I* like to work and what I want my agents to do. Your mileage may vary; your stack, team conventions, and taste are probably different from mine. Treat this as a starting point to fork and edit, not a one-size-fits-all standard.

## The problem

Modern AI coding agents are powerful, but without explicit guidelines they default to generating **slop code**:

- **Magic strings and magic numbers** scattered everywhere instead of named constants.
- **`any` types** thrown in to silence the TypeScript compiler.
- **Duplicated components and hooks** because the agent didn't check what already exists in the codebase.
- **God classes / god modules** that mash unrelated responsibilities together because the agent kept appending to whatever file it opened first.
- **Inline business logic in `main` / entry points** instead of clean orchestration.
- **Useless comments** like `// increment i` that add noise without information.
- **Parallel architectural styles** introduced because the agent didn't bother to match the existing patterns.

The root cause is the same in every case: **the agent has no shared definition of "good" for your project.** It does whatever its training distribution suggests, which averages out to mediocre. It will happily ship code that compiles, passes tests, and is genuinely worse than what a thoughtful human would write, because nothing told it not to.

A good set of Cursor Project Rules, a `CLAUDE.md` (for Claude Code), or an `AGENTS.md` (for Codex and other AGENTS.md-aware agents) fixes this. These files load into the agent's context when applicable, so the rules are present when the agent needs them instead of being something it has to remember or rediscover. Spending five minutes writing one saves hours of cleanup later.

This repo is a starting point. It's project-agnostic, opinionated, and has built-in escape hatches (e.g. "don't force reusability where it doesn't fit") so the rules guide rather than tyrannize.

## What slop code looks like

Concrete examples of what an unguided agent will happily ship.

### 1. Magic strings everywhere

**Slop:**
```ts
function getUserBadge(user) {
  if (user.role === "admin") return "red";
  if (user.role === "mod") return "blue";
  if (user.role === "user") return "gray";
  if (user.status === 2) return "gold";
}
```

**Better:**
```ts
const ROLE = { ADMIN: "admin", MOD: "mod", USER: "user" } as const;
const STATUS_VIP = 2;
const BADGE_BY_ROLE: Record<Role, string> = {
  [ROLE.ADMIN]: "red",
  [ROLE.MOD]: "blue",
  [ROLE.USER]: "gray",
};

function getUserBadge(user: User) {
  if (user.status === STATUS_VIP) return "gold";
  return BADGE_BY_ROLE[user.role];
}
```

### 2. `any` to silence the compiler

**Slop:**
```ts
function parseResponse(data: any): any {
  return data.results.map((r: any) => r.value);
}
```

**Better:**
```ts
interface ApiResponse<T> { results: Array<{ value: T }>; }

function parseResponse<T>(data: ApiResponse<T>): T[] {
  return data.results.map((r) => r.value);
}
```

### 3. Duplicated component instead of reusing one

**Slop** (third near-identical button this week):
```tsx
function SubmitButton({ onClick, label }) {
  return (
    <button
      style={{ backgroundColor: "#3b82f6", padding: "8px 16px", borderRadius: "6px" }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

**Better:** use the existing `<Button variant="primary">` from `components/ui/Button.tsx`. If it can't do what you need, extend it once so every caller benefits.

### 4. God class

**Slop:**
```ts
class UserManager {
  login() { /* ... */ }
  logout() { /* ... */ }
  sendWelcomeEmail() { /* ... */ }
  chargeSubscription() { /* ... */ }
  generateInvoicePdf() { /* ... */ }
  logAuditEvent() { /* ... */ }
  resizeAvatar() { /* ... */ }
}
```

That's auth *and* email *and* billing *and* PDFs *and* logging *and* image processing in one class. Split it: `AuthService`, `BillingService`, `Mailer`, etc.

### 5. Bloated `main` with inline business logic

**Slop:**
```ts
async function main() {
  const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
  const db = await mysql.createConnection({ host: config.db.host, /* ... */ });
  const users = await db.query("SELECT * FROM users WHERE active = 1");
  for (const user of users) {
    if (user.lastLogin < Date.now() - 30 * 24 * 60 * 60 * 1000) {
      await db.query("UPDATE users SET status = 'inactive' WHERE id = ?", [user.id]);
      await sendgrid.send({ to: user.email, subject: "We miss you", /* ... */ });
    }
  }
}
```

**Better:**
```ts
async function main() {
  const config = loadConfig();
  const db = await connectDatabase(config.db);
  const mailer = createMailer(config.sendgrid);

  await deactivateStaleUsers(db, mailer);
}
```

### 6. Useless comments that just restate the code

**Slop:**
```ts
// Increment counter by one
counter += 1;

// Loop through all users
for (const user of users) {
  // Get the user's email
  const email = user.email;
  // Send the email
  sendEmail(email);
}
```

**Better:** delete every comment above. The code already says all of that. Save comments for *why*, not *what*:

```ts
// Stripe webhooks can fire twice for the same event; dedupe by event.id.
if (await seenEvent(event.id)) return;
```

These six patterns show up constantly in unguided agent output. The whole point of Cursor Project Rules, `CLAUDE.md`, and `AGENTS.md` is to keep the agent from defaulting to them.

## What's included

```
src/                       # ── source of truth ── edit here, then `npm run generate`
├── sections/              #   one .md per guideline section (title-less bodies)
│   ├── how-to-work.md
│   ├── working-as-an-agent.md
│   ├── general-style.md     #   …and the rest of the always-on sections
│   ├── typescript.md        #   scoped sections live here too
│   ├── react.md
│   └── testing.md
└── generate.mjs           # Packages sections into every file below (zero deps)

.claude/                   # ── generated ──
├── CLAUDE.md              # Always-loaded by Claude Code: general rules
└── rules/                 # Path-scoped rules: load conditionally
    ├── typescript.md      #   only when *.ts / *.tsx are read
    ├── react.md           #   only when *.tsx / components/** are read
    └── testing.md         #   only when test files are read

.cursor/                   # ── generated ──
└── rules/                 # Cursor Project Rules
    ├── coding-guidelines.mdc  # Always Apply: general rules
    ├── typescript.mdc         # Apply to Specific Files: *.ts / *.tsx
    ├── react.mdc              # Apply to Specific Files: *.tsx / components/**
    └── testing.mdc            # Apply to Specific Files: test files

.codex/AGENTS.md           # ── generated ── single file, everything inlined
AGENTS.md                  # ── generated ── same content at the repo root, for
                           #   AGENTS.md-aware agents that discover it by walking up
```

Claude Code loads `.claude/CLAUDE.md` on every turn, plus any rule files in `.claude/rules/` whose `paths:` glob matches files Claude reads or works with. Path-scoped rules trigger on those file operations, not preemptively at session start, so the always-on context stays small while language- or area-specific guidance loads only when it's relevant. ([docs](https://code.claude.com/docs/en/claude-directory))

Cursor Project Rules live in `.cursor/rules` as `.mdc` files. The general rule uses `alwaysApply: true`; language- and workflow-specific rules use Cursor `globs` so they attach only for matching files. Cursor also supports project-root and nested `AGENTS.md` as a simple markdown alternative when you do not need `.mdc` metadata. ([docs](https://cursor.com/docs/rules))

Codex and agents that only use the `AGENTS.md` convention don't support these path-scoped rule directories, so `.codex/AGENTS.md` ships as a single file with everything inlined.

The guidelines cover:

- **How to Work** *(always-on)*: read before editing, plan multi-step changes, verify after, push back instead of silently complying, stay in scope.
- **General Style** *(always-on)*: intent-revealing names, no premature abstraction, comments explain *why* not *what*.
- **Reusability** *(always-on)*: no magic values, single-responsibility functions, design for reuse without forcing it.
- **Architecture** *(always-on)*: match existing patterns, clean `init` / `main`, no god classes, single reason to change.
- **No Shortcuts** *(always-on)*: no lint suppressions, no escape-hatch casts, no skipped tests, no bypassed quality gates.
- **Error Handling** *(always-on)*: decide recoverable vs. fatal, never swallow, log with context, don't use exceptions for control flow.
- **Dependencies** *(always-on)*: don't add a dep when stdlib or existing utilities suffice; justify any new one.
- **Security** *(always-on)*: never log secrets/PII, validate at trust boundaries, parameterized queries, no DIY crypto.
- **Git and Pull Requests** *(always-on)*: protect user changes, no destructive commands without confirmation, small focused commits and PRs.
- **TypeScript** *(scoped to `*.ts` / `*.tsx`)*: no `any`, no `as` casts to silence the compiler, strict mode, discriminated unions over optional fields.
- **React / Frontend** *(scoped to `*.tsx` / `components/**` / `hooks/**`)*: check existing components/hooks before writing new ones, prefer existing style tokens.
- **Testing** *(scoped to test files)*: match the project's style, test behavior not implementation, cover boundaries not just the happy path.

## Editing & regenerating

Every per-tool file is **generated** from `src/sections/*.md` by `src/generate.mjs`. Each section is authored once as a title-less markdown body; the script wraps it in the right frontmatter and headings for each tool, so the wording can't drift between Claude, Cursor, and the `AGENTS.md` copies.

```bash
npm run generate   # rewrite every generated file from src/sections/
npm run check      # CI guard: fail if a generated file is stale or hand-edited
```

Generated files carry a `GENERATED FILE — do not edit directly` banner, and `.github/workflows/check-generated.yml` runs `npm run check` on every push and PR — so a hand-edit that bypasses the source fails CI. The generator has zero dependencies; `node src/generate.mjs` works without an `npm install`.

> If you only **copied the generated files** into your own project (via the steps below), you don't have `src/` — just edit the copied files directly. The generator is for maintaining or forking *this* repo.

## How to use

### Option 1: One-line install with cURL (recommended)

Grab just the files you need without cloning the repo.

**Claude Code (project-level — full setup with path-scoped rules):**
```bash
mkdir -p .claude/rules && \
  curl -fsSL -o .claude/CLAUDE.md       https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.claude/CLAUDE.md && \
  curl -fsSL -o .claude/rules/typescript.md https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.claude/rules/typescript.md && \
  curl -fsSL -o .claude/rules/react.md      https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.claude/rules/react.md && \
  curl -fsSL -o .claude/rules/testing.md    https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.claude/rules/testing.md
```

**Cursor (project-level — Project Rules):**
```bash
mkdir -p .cursor/rules && \
  curl -fsSL -o .cursor/rules/coding-guidelines.mdc https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.cursor/rules/coding-guidelines.mdc && \
  curl -fsSL -o .cursor/rules/typescript.mdc        https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.cursor/rules/typescript.mdc && \
  curl -fsSL -o .cursor/rules/react.mdc             https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.cursor/rules/react.mdc && \
  curl -fsSL -o .cursor/rules/testing.mdc           https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.cursor/rules/testing.mdc
```

In Cursor, you can also import this GitHub repo from **Customize → Rules → Add Rule → Remote Rule (Github)**. Cursor scans for `.mdc` files and syncs them into `.cursor/rules/imported/<repoName>`.

**Codex CLI / AGENTS.md convention (project-level — single file):**
```bash
curl -fsSL -o AGENTS.md https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.codex/AGENTS.md
```

**Install globally (applies to every project on your machine):**
```bash
# Claude Code (user-level)
mkdir -p ~/.claude/rules && \
  curl -fsSL -o ~/.claude/CLAUDE.md             https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.claude/CLAUDE.md && \
  curl -fsSL -o ~/.claude/rules/typescript.md   https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.claude/rules/typescript.md && \
  curl -fsSL -o ~/.claude/rules/react.md        https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.claude/rules/react.md && \
  curl -fsSL -o ~/.claude/rules/testing.md      https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.claude/rules/testing.md

# Codex CLI (user-level)
mkdir -p ~/.codex && curl -fsSL -o ~/.codex/AGENTS.md https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.codex/AGENTS.md
```

Cursor Project Rules are designed to be checked into each project. For global Cursor preferences, use **Customize → Rules** and add User Rules.

### Option 2: Clone and copy

```bash
git clone https://github.com/aandrewduong/agent-coding-guidelines.git
cd your-project

# For Claude Code (copies CLAUDE.md and the path-scoped rules directory)
cp -r /path/to/agent-coding-guidelines/.claude .

# For Cursor (copies Project Rules)
cp -r /path/to/agent-coding-guidelines/.cursor .

# For Codex CLI / other agents using the AGENTS.md convention
cp /path/to/agent-coding-guidelines/.codex/AGENTS.md .
```

Claude Code reads from `.claude/CLAUDE.md` and `.claude/rules/`. Cursor reads Project Rules from `.cursor/rules/*.mdc`, and can also read `AGENTS.md` in the project root or subdirectories. Codex and other AGENTS.md-aware agents read from `./AGENTS.md` (project root) or walk up the directory tree to find one.

### Option 3: Sparse-checkout / submodule

If you want to keep pulling updates from this repo into multiple projects, add it as a git submodule or use sparse checkout. Most users will find a one-time cURL or copy is enough.

## Customizing

The guidelines are intentionally generic. Edit them for your project:

- **Working in this repo (or a fork)?** Edit `src/sections/*.md` and run `npm run generate` — don't hand-edit the generated files (CI will reject it). If you only copied the generated files into your project, edit those directly.
- **Drop rule files that don't apply.** Working in pure Python? Delete the TypeScript and React sections from `src/sections/` (remove their entries from `generate.mjs`) and regenerate — or, if you copied files, just delete them from `.claude/rules/` / `.cursor/rules/` and trim those sections out of `AGENTS.md`.
- **Add your own rules.** In this repo, add a `src/sections/<name>.md` body and register it in `GENERAL_SECTIONS` or `SCOPED_SECTIONS` in `generate.mjs`, then regenerate. If you copied files, drop a `.claude/rules/*.md` with a `paths:` glob (Claude) or a `.cursor/rules/*.mdc` with `globs` (Cursor) directly.
- **Add project-specific rules** to `.claude/CLAUDE.md`, `.cursor/rules/coding-guidelines.mdc`, or `AGENTS.md`. Things like *"all API handlers go in `src/api/`"* or *"use `pino` for logging"* belong in your project's copy, not the generic template.
- **Tighten or relax rules** to match your team's taste. The goal is consistency, not adherence to *these specific* rules.

Keep in mind: every line of always-on instructions is loaded into the agent's context whenever those instructions apply. Verbosity has a real cost — that's exactly the problem path-scoped rules solve. Move anything language- or area-specific into `.claude/rules/` or scoped `.cursor/rules/*.mdc` files so it only loads when relevant.

## Why this works

LLMs are pattern matchers. When you give them clear, concrete rules in their context, they follow them. Not perfectly, but well enough that the *baseline* quality of generated code goes up substantially. The difference between an agent with no guidelines and one with thoughtful Cursor Project Rules, `CLAUDE.md`, or `AGENTS.md` is roughly the difference between a junior who's never seen the codebase and one who's been onboarded.

This file is the onboarding doc.

## Contributing

PRs welcome, especially for additional sections that stay project-agnostic.

## License

MIT. Use it however you like.
