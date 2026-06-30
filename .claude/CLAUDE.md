<!-- GENERATED FILE — do not edit directly. Edit src/sections/*.md and run `npm run generate`. -->

# Coding Guidelines

The sections below are always loaded. Topic-specific rules (TypeScript, React, testing) live in `.claude/rules/` and load when Claude reads or works with files matching their `paths:` globs.

## How to Work

- Before making non-trivial changes, read enough of the surrounding code to understand the conventions, abstractions, and existing utilities. Match what's there. If you can't find an obvious pattern, ask before introducing a new one.
- Before large edits, check the current diff (`git status`, `git diff`) and work with existing in-progress changes rather than overwriting them.
- For multi-step changes, plan first. List the files you expect to touch and the order of operations. Surface the plan when the change is large enough that the user will want to course-correct early.
- Verify your work after making changes. Run the typechecker, linter, and tests if they exist. If you can't run them, say so explicitly *and describe the remaining risk* — don't imply the change is verified.
- When uncertain about intent (ambiguous request, multiple valid interpretations, missing constraint), ask one focused question rather than guessing. Don't ask for things you can determine by reading the code.
- Push back when asked to do something that conflicts with these guidelines or with the existing architecture. Explain the conflict and propose an alternative. Don't silently comply.
- Stay in scope. If you notice unrelated issues while working, mention them but don't fix them in the same change unless asked.

## Working as an Agent

- Keep diffs minimal. Change only what the task requires. Don't reformat untouched lines, reorder imports, or rename things outside scope — gratuitous churn buries the real change and makes review impossible.
- Don't invent APIs. Before calling a function or referencing a config key, environment variable, or file path, confirm it actually exists in the codebase or its documentation. A plausible-looking name is not proof that it exists.
- Do what was asked — no gold-plating. Don't add config options, abstractions, retries, or "future-proofing" that weren't requested. Unrequested complexity is also slop.
- Don't fabricate verification. Only call something tested or working if you actually ran it. If you couldn't run it, say so plainly and state the residual risk.
- Clean up after yourself. Remove debug logging, commented-out experiments, and scratch files before you finish.
- When stuck, stop and ask. If two attempts at a fix don't work, report what you tried and what you observed instead of thrashing on more guesses.

## General Style

- Names should describe intent, not implementation. A reader should understand what a value or function is for without reading its body.
- Avoid premature abstraction. Three similar lines is better than a wrong abstraction. Once a pattern is clearly repeating, extract it.
- Validate at system boundaries (user input, external APIs, file I/O). Trust internal code.
- Async code is where subtle bugs hide: don't leave promises unawaited or rejections unhandled, avoid sequential `await` in a loop when the work can run concurrently, and guard shared state against races.
- Comments explain *why*: a non-obvious constraint, a tricky invariant, a workaround for a specific bug, or behavior that would surprise a reader. Skip comments that restate the code.

Slop (every comment restates the code):

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

Better (delete the noise; keep comments that earn their place):

```ts
// Stripe webhooks can fire twice for the same event; dedupe by event.id.
if (await seenEvent(event.id)) return;
```

## Reusability

- Write code that is reusable and composable. Extract shared logic into functions, modules, or components rather than duplicating it.
- No magic strings or magic numbers when their meaning isn't obvious from context. Define them as named constants, enums, or configuration values so the meaning is explicit and they can be changed in one place. Don't extract constants for self-evident literals (`const ZERO = 0`); that's noise.
- Prefer parameters over hardcoded values when a function might be called from more than one context.
- Keep functions focused on a single responsibility so they can be reused without dragging in unrelated behavior.
- When writing a new function, design it so it *can* be reused later: generic inputs, no hidden dependencies on caller-specific state, clear return values. If the logic is genuinely one-off and can't reasonably be generalized, that's fine; don't force reusability where it doesn't fit.

## Architecture

- When adding new code, follow the architectural patterns already established in the project. Match the existing folder structure, naming conventions, layering (e.g. controller/service/repository), and data flow rather than introducing a parallel style.
- If the existing pattern is genuinely wrong for the new use case, raise it before diverging. Don't silently introduce a second way of doing things.
- Prefer a clean `init` / `main` function. Keep entry points small and declarative. They should orchestrate setup (config, dependencies, wiring) and delegate the actual work to well-named functions, not contain business logic inline.
- Side effects (I/O, network, global state) belong at the edges. Keep core logic pure and testable.
- No god classes or god modules. If a class or file is accumulating unrelated responsibilities, split it along its natural seams (an auth/billing/mail/logging blob becomes `AuthService`, `BillingService`, `Mailer`, `AuditLog` — each testable and swappable on its own).
- A class or module should have one clear reason to change. If you find yourself describing what it does with "and" ("it handles auth *and* billing *and* logging"), that's a signal to split.

## No Shortcuts

- Do not suppress lint errors to make them go away. No `// eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `# noqa`, or equivalent escape hatches without a documented reason. The lint error is a signal; fix the underlying issue.
- Do not skip type checks with casts (`as any`, `as unknown as X`) just to get the build green. If the types are wrong, fix the types.
- Do not comment out, skip, or weaken failing tests to make CI pass. If the test is wrong, fix the test. If the code is wrong, fix the code.
- Do not bypass project quality gates (typecheck, tests, formatter, pre-commit hooks, CI checks) to ship faster. If a gate is wrong, fix the gate; don't route around it.
- Do not leave `TODO: fix later` in place of doing the work when the work is in scope. If something genuinely has to be deferred, file an issue and link to it from the comment.
- When a third-party type is genuinely wrong, fix it at the boundary: add a typed wrapper in one well-documented place instead of scattering suppressions across call sites.
- Speed is not an excuse. A shortcut that ships today becomes a debugging session next week.

## Error Handling

- Decide explicitly whether an error is recoverable. Recoverable errors are returned or surfaced to the caller; unrecoverable ones throw or panic.
- Don't swallow errors. `catch (e) {}` and `catch (e) { console.log(e) }` are the same as not catching. If you catch, do something meaningful: retry, fall back, translate to a domain error, or log with enough context to debug.
- Error messages should help the next person reading the log. Include the relevant identifiers (user id, request id, file path) and the operation that failed.
- Don't use exceptions for control flow. Throw on unexpected states, not on expected branches.

## Dependencies

- Don't add a new dependency when existing project utilities or the standard library are sufficient. Search the codebase first.
- If a new dependency is genuinely needed, justify it: what does it do that we can't reasonably do ourselves, and why this library over the alternatives?
- Prefer small, well-maintained libraries with clear scope over kitchen-sink frameworks pulled in for a single helper.
- Removing a dependency is also a change worth considering — dead deps are a maintenance and security cost.

## Security

- Never log secrets, tokens, passwords, or full PII payloads. Redact at the logging boundary, not at every call site.
- Validate and sanitize all input crossing a trust boundary (HTTP requests, file uploads, third-party webhooks). Don't rely on client-side validation alone.
- Use parameterized queries or an ORM. Never build SQL with string concatenation.
- Don't roll your own crypto, auth, or session management. Use the project's existing primitives or a vetted library.
- Secrets belong in environment variables or a secret manager, never in code, never in commit history. If a secret is committed by mistake, rotate it; deleting the commit is not enough.

## Git and Pull Requests

- Never discard or overwrite the user's uncommitted changes. Don't run destructive commands (`git reset --hard`, `git checkout --`, `git clean -fd`, mass deletes, force-push to shared branches) without explicit confirmation.
- Commits should be small and focused. One logical change per commit. A commit that touches twenty files across five concerns is hard to review and impossible to revert cleanly.
- Commit messages: imperative subject line under 72 characters, then a blank line, then a body explaining *why* the change is being made when it isn't obvious from the diff.
- A pull request should do one thing. If the description needs the word "also" more than once, split it.
- Match the project's existing branch naming, commit conventions, and PR template.
- Don't force-push to shared branches. Don't rewrite history that other people have based work on.
