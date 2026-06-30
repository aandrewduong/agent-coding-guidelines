- Write code that is reusable and composable. Extract shared logic into functions, modules, or components rather than duplicating it.
- No magic strings or magic numbers when their meaning isn't obvious from context. Define them as named constants, enums, or configuration values so the meaning is explicit and they can be changed in one place. Don't extract constants for self-evident literals (`const ZERO = 0`); that's noise.
- Prefer parameters over hardcoded values when a function might be called from more than one context.
- Keep functions focused on a single responsibility so they can be reused without dragging in unrelated behavior.
- When writing a new function, design it so it *can* be reused later: generic inputs, no hidden dependencies on caller-specific state, clear return values. If the logic is genuinely one-off and can't reasonably be generalized, that's fine; don't force reusability where it doesn't fit.

Slop (mystery numbers, duplicated comparison logic):

```ts
function isStale(user) {
  return user.lastLogin < Date.now() - 30 * 24 * 60 * 60 * 1000;
}

function shouldWarn(user) {
  return user.lastLogin < Date.now() - 21 * 24 * 60 * 60 * 1000;
}
```

Better:

```ts
const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_AFTER_DAYS = 30;
const WARN_AFTER_DAYS = 21;

function daysSinceLogin(user: User): number {
  return (Date.now() - user.lastLogin) / DAY_MS;
}

const isStale = (user: User) => daysSinceLogin(user) >= STALE_AFTER_DAYS;
const shouldWarn = (user: User) => daysSinceLogin(user) >= WARN_AFTER_DAYS;
```
