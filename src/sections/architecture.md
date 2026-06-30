- When adding new code, follow the architectural patterns already established in the project. Match the existing folder structure, naming conventions, layering (e.g. controller/service/repository), and data flow rather than introducing a parallel style.
- If the existing pattern is genuinely wrong for the new use case, raise it before diverging. Don't silently introduce a second way of doing things.
- Prefer a clean `init` / `main` function. Keep entry points small and declarative. They should orchestrate setup (config, dependencies, wiring) and delegate the actual work to well-named functions, not contain business logic inline.
- Side effects (I/O, network, global state) belong at the edges. Keep core logic pure and testable.
- No god classes or god modules. If a class or file is accumulating unrelated responsibilities, split it along its natural seams.
- A class or module should have one clear reason to change. If you find yourself describing what it does with "and" ("it handles auth *and* billing *and* logging"), that's a signal to split.

Slop (god class doing six unrelated things):

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

Better: split along seams. `AuthService`, `BillingService`, `Mailer`, `AuditLog`, `AvatarProcessor`. Each can be tested, swapped, and reasoned about on its own.

Slop (entry point with inline business logic):

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

Better:

```ts
async function main() {
  const config = loadConfig();
  const db = await connectDatabase(config.db);
  const mailer = createMailer(config.sendgrid);

  await deactivateStaleUsers(db, mailer);
}
```
