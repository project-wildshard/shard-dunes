# Durable Ledger proof (SH-dunes-4)

- `test/ci/durable-ledger.test.mjs` plays the Signal route, checks the
  quest and the Matriarch file exactly the product Ledger's two facts
  and pay 5 and 20 coins once, saves with the worker's commit wire
  (`serializeSimSnapshot(snapshotSimHostBytes(host))`), restores from
  that string alone and plays on: strikes her body, relights the fire
  from the same deck, walks back. Nothing files again.
- The route moved to `test/ci/signal-route.mjs`, shared with
  signal-journey (same ticks).
- Mutants that fail it: restore without the wire; a wrong victory fact
  (headlessOwners.ts); the matriarch Ledger rule dropped; the restore
  losing `sunscar.complete`. The quest re-checks only on its own step
  flags, so a lost completion shows as an incomplete quest, not a second
  filing; the test reads completion back rather than trusting silence.
- The build accepts a victory fact with no Ledger rule, and a rule whose
  fact nothing emits; only this play test catches the mismatch.
