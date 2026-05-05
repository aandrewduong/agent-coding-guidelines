# Agent Coding Guidelines

Without proper guidelines, AI coding agents default to generating slop code: code that compiles, passes tests, and quietly accumulates technical debt that future developers (or future you) have to clean up.

It's like handing a toddler a hammer and saying "go build a house." The hammer works. The toddler is enthusiastic. The house is not up to code.

AI gets smarter with each model release, but smarter without guidance just means it builds *bigger* broken houses, *faster*. Capability without direction amplifies the mess. A good `CLAUDE.md` / `AGENTS.md` is the blueprint that turns raw capability into maintainable code.

A drop-in `CLAUDE.md` / `AGENTS.md` for AI coding agents (Claude Code, OpenAI Codex CLI) that enforces basic engineering principles: reusability, no magic strings, no `any` in TypeScript, no god classes, clean entry points, and meaningful comments only.

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

A good `CLAUDE.md` (for Claude Code) or `AGENTS.md` (for Codex and most other agents) fixes this. These files load into the agent's context on every turn, so the rules are *always* present, not something it has to remember or rediscover. Spending five minutes writing one saves hours of cleanup later.

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

These six patterns show up constantly in unguided agent output. The whole point of `CLAUDE.md` / `AGENTS.md` is to keep the agent from defaulting to them.

## What's included

```
.claude/CLAUDE.md   # Loaded automatically by Claude Code
.codex/AGENTS.md    # Loaded by OpenAI Codex CLI and other agents that follow the AGENTS.md convention
```

Both files contain the same guidelines, covering:

- **Reusability**: no magic values, single-responsibility functions, design for reuse.
- **TypeScript**: no `any`, no escape-hatch casts, strict mode, generics over widening.
- **React / Frontend**: check existing components/hooks before writing new ones, no hardcoded copy/colors/spacing.
- **Architecture**: match existing patterns, clean `init` / `main`, no god classes, single reason to change.
- **General style**: intent-revealing names, no premature abstraction, comments explain *why* not *what*.

## How to use

### Option 1: One-line install with cURL (recommended)

Grab just the file you need without cloning the repo.

**Claude Code (project-level):**
```bash
curl -fsSL -o CLAUDE.md https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.claude/CLAUDE.md
```

**Codex CLI / AGENTS.md convention (project-level):**
```bash
curl -fsSL -o AGENTS.md https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.codex/AGENTS.md
```

**Both at once:**
```bash
curl -fsSL -o CLAUDE.md https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.claude/CLAUDE.md && \
curl -fsSL -o AGENTS.md https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.codex/AGENTS.md
```

**Install globally (applies to every project on your machine):**
```bash
# Claude Code (user-level)
mkdir -p ~/.claude && curl -fsSL -o ~/.claude/CLAUDE.md https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.claude/CLAUDE.md

# Codex CLI (user-level)
mkdir -p ~/.codex && curl -fsSL -o ~/.codex/AGENTS.md https://raw.githubusercontent.com/aandrewduong/agent-coding-guidelines/main/.codex/AGENTS.md
```

### Option 2: Clone and copy

```bash
git clone https://github.com/aandrewduong/agent-coding-guidelines.git
cd your-project

# For Claude Code
cp /path/to/agent-coding-guidelines/.claude/CLAUDE.md .

# For Codex CLI / other agents using the AGENTS.md convention
cp /path/to/agent-coding-guidelines/.codex/AGENTS.md .
```

Most agents look for these files at the project root (`./CLAUDE.md`, `./AGENTS.md`) or walk up the directory tree to find them.

### Option 3: Sparse-checkout / submodule

If you want to keep pulling updates from this repo into multiple projects, add it as a git submodule or use sparse checkout. Most users will find a one-time cURL or copy is enough.

## Customizing

The guidelines are intentionally generic. Edit them for your project:

- **Drop sections that don't apply.** Working in pure Python? Delete the TypeScript and React sections.
- **Add project-specific rules.** Things like *"all API handlers go in `src/api/`"* or *"use `pino` for logging"* belong in your project's copy, not the generic template.
- **Tighten or relax rules** to match your team's taste. The goal is consistency, not adherence to *these specific* rules.

Keep in mind: every line of `CLAUDE.md` / `AGENTS.md` is loaded into the agent's context on every turn. Verbosity has a real cost. If a rule isn't pulling its weight, delete it.

## Why this works

LLMs are pattern matchers. When you give them clear, concrete rules in their context, they follow them. Not perfectly, but well enough that the *baseline* quality of generated code goes up substantially. The difference between an agent with no guidelines and one with a thoughtful `CLAUDE.md` / `AGENTS.md` is roughly the difference between a junior who's never seen the codebase and one who's been onboarded.

This file is the onboarding doc.

## Contributing

PRs welcome, especially for additional sections (testing, error handling, security) that stay project-agnostic.

## License

MIT. Use it however you like.
