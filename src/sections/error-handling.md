- Decide explicitly whether an error is recoverable. Recoverable errors are returned or surfaced to the caller; unrecoverable ones throw or panic.
- Don't swallow errors. `catch (e) {}` and `catch (e) { console.log(e) }` are the same as not catching. If you catch, do something meaningful: retry, fall back, translate to a domain error, or log with enough context to debug.
- Error messages should help the next person reading the log. Include the relevant identifiers (user id, request id, file path) and the operation that failed.
- Don't use exceptions for control flow. Throw on unexpected states, not on expected branches.

Slop (silent swallow, useless message):

```ts
try {
  await chargeCard(user, amount);
} catch (e) {
  console.log("error");
}
```

Better:

```ts
try {
  await chargeCard(user, amount);
} catch (err) {
  logger.error("charge failed", { userId: user.id, amount, err });
  throw new BillingError("Could not charge card", { cause: err });
}
```
