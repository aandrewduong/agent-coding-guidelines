- Names should describe intent, not implementation. A reader should understand what a value or function is for without reading its body.
- Avoid premature abstraction. Three similar lines is better than a wrong abstraction. Once a pattern is clearly repeating, extract it.
- Validate at system boundaries (user input, external APIs, file I/O). Trust internal code.
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
