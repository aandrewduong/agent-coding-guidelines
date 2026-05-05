# Coding Guidelines

## Reusability

- Write code that is reusable and composable. Extract shared logic into functions, modules, or components rather than duplicating it.
- No magic strings or magic numbers. Define them as named constants, enums, or configuration values so their meaning is explicit and they can be reused or changed in one place.
- Prefer parameters over hardcoded values when a function might be called from more than one context.
- Keep functions focused on a single responsibility so they can be reused without dragging in unrelated behavior.
- When writing a new function, design it so it *can* be reused later — generic inputs, no hidden dependencies on caller-specific state, clear return values. If the logic is genuinely one-off and can't reasonably be generalized, that's fine; don't force reusability where it doesn't fit.

## TypeScript

- Do not use the `any` type. If a type is genuinely unknown, use `unknown` and narrow it before use.
- Avoid `as` casts to silence the compiler. Fix the underlying type instead.
- Prefer `interface` or `type` definitions for object shapes over inline structural types when they will be reused.
- Enable and respect strict mode (`strict: true` in `tsconfig.json`).
- Use generics to preserve type information across reusable utilities rather than widening to `any` or `unknown`.
- Prefer discriminated unions over optional fields when modeling variants.

## React / Frontend Projects

- Before building a new component, check the existing component library/folder (e.g. `components/`, `ui/`, `shared/`) for one that already does the job or can be extended. Don't reinvent buttons, modals, inputs, layouts, etc.
- If an existing component is *almost* right, prefer extending it via props or composition over duplicating it. If it's wrong for the new use case, refactor it so both callers can share it rather than forking.
- Keep components small and presentational where possible. Lift state up and pass data via props so the component stays reusable across contexts.
- No hardcoded copy, colors, spacing, or breakpoints inside components. Pull from theme tokens, design system constants, or i18n strings.
- Co-locate styles and tests with the component, but keep the component itself free of page- or feature-specific logic so it can be dropped into other parts of the app.
- Reuse existing hooks before writing new ones. If you write a new hook, make sure it isn't a near-duplicate of one already in the codebase.

## Architecture

- When adding new code, follow the architectural patterns already established in the project. Match the existing folder structure, naming conventions, layering (e.g. controller/service/repository), and data flow rather than introducing a parallel style.
- If the existing pattern is genuinely wrong for the new use case, raise it before diverging — don't silently introduce a second way of doing things.
- Prefer a clean `init` / `main` function: keep entry points small and declarative. They should orchestrate setup (config, dependencies, wiring) and delegate the actual work to well-named functions, not contain business logic inline.
- Side effects (I/O, network, global state) belong at the edges. Keep core logic pure and testable.
- No god classes or god modules. If a class/file is accumulating unrelated responsibilities, split it along its natural seams. Smaller, focused units are easier to maintain, test in isolation, and reuse.
- A class or module should have one clear reason to change. If you find yourself describing what it does with "and" — "it handles auth *and* billing *and* logging" — that's a signal to split.

## No Shortcuts

- Do not suppress lint errors to make them go away. No `// eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `# noqa`, or equivalent escape hatches without a documented reason. The lint error is a signal; fix the underlying issue.
- Do not skip type checks with casts (`as any`, `as unknown as X`) just to get the build green. If the types are wrong, fix the types.
- Do not comment out, skip, or weaken failing tests to make CI pass. If the test is wrong, fix the test. If the code is wrong, fix the code.
- Do not bypass project quality gates (typecheck, tests, formatter, pre-commit hooks, CI checks) to ship faster. If a gate is wrong, fix the gate; don't route around it.
- Do not leave `TODO: fix later` in place of doing the work when the work is in scope. If something genuinely has to be deferred, file an issue and link to it from the comment.
- Speed is not an excuse. A shortcut that ships today becomes a debugging session next week.

## Testing

- If test cases exist in the project, use them. Run them before and after changes to confirm nothing regressed, and add to them when introducing new behavior.
- Match the project's existing test style (framework, file location, naming) rather than introducing a new one.
- Test behavior, not implementation. Tests should still pass after a refactor that doesn't change observable behavior.
- If no tests exist for the area you're touching, that's fine; don't bolt on a test framework just to add one. But flag it if the change is risky.

## General Style

- Names should describe intent, not implementation. A reader should understand what a value or function is for without reading its body.
- Avoid premature abstraction. Three similar lines is better than a wrong abstraction — but once a pattern is clearly repeating, extract it.
- Validate at system boundaries (user input, external APIs). Trust internal code.
- Comments are useful — but only when they add information the code itself can't convey. Skip obvious ones like `// increment i` or `// return the user`; they're noise.
- Good comments explain *why*: a non-obvious constraint, a tricky invariant, a workaround for a specific bug, or behavior that would surprise a reader.
- If a comment is just restating what a well-named function or variable already says, delete the comment (or rename the code so the comment isn't needed).
