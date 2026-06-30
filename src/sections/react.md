- Before building a new component, check the existing component library/folder (e.g. `components/`, `ui/`, `shared/`) for one that already does the job or can be extended. Don't reinvent buttons, modals, inputs, layouts.
- If an existing component is *almost* right, prefer extending it via props or composition over duplicating it. If it's wrong for the new use case, refactor it so both callers can share it rather than forking.
- Keep components small and presentational where possible. Lift state up and pass data via props so the component stays reusable across contexts.
- No hardcoded copy, colors, spacing, or breakpoints inside components. Pull from theme tokens, design system constants, or i18n strings.
- Co-locate styles and tests with the component, but keep the component itself free of page- or feature-specific logic so it can be dropped into other parts of the app.
- Reuse existing hooks before writing new ones. If you write a new hook, make sure it isn't a near-duplicate of one already in the codebase.
- Build on semantic HTML (`button`, `a`, `label`, `nav`, headings) before reaching for a `div` with a click handler. Native elements bring focus, keyboard, and screen-reader behavior for free.
- Every input has an associated `<label>`; every meaningful image has `alt` text (decorative images get `alt=""`). Interactive elements must be reachable and operable by keyboard, and color must not be the only signal for state or meaning.
- Reach for ARIA only to fill gaps native HTML can't express. A correct native element beats a `div` patched with `role` and `aria-*`.

Slop (third near-identical button this week, hardcoded styles):

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

Better (use the existing primitive):

```tsx
import { Button } from "@/components/ui/Button";

<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>
```

If `Button` doesn't yet support what you need, add the variant or prop once so every caller benefits.
