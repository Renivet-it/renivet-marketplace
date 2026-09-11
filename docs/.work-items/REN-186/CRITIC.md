# Independent Critic Review — REN-186

## Initial review

Decision: **FAIL / BLOCKED before amendment**.

The independent critic identified these blockers in the initial draft:

- The corporate PDF route coverage was incomplete; delivery challan and
  summary PDF were not classified.
- Fail-closed requirements did not define required fields, response behavior,
  or guard placement.
- Live settings versus historical document behavior was ambiguous.
- Commission invoice side effects could allocate a number before validation.
- Exact migration/API names, legacy payload behavior, clearing, and partial
  operational-address semantics were unspecified.
- Test expectations did not cover route-level output, authorization, retries,
  or absence of fabricated values.

## Amendments made

The SPEC now includes the complete eight-route matrix, exact operational field
names, required identity fields and HTTP 422/precondition behavior, validation
before side effects, live-settings/snapshot boundaries, no-backfill migration
rules, legacy/partial/clear scenarios, authorization/telemetry constraints,
and route/tax-preservation test expectations.

## Follow-up review

The second independent critic confirmed that the first amendments were
substantively required, and additionally flagged that the Linear dependency
needed to be reconciled with the user confirmation. A Linear comment now
records the confirmed GSTIN/registered-office pairing and resolves that
dependency. The amended contract remains subject to final governance
validation.

Second-review findings were incorporated: exact migration/legacy semantics,
route-level failure behavior, authorization, side-effect ordering, and
tax/place-of-supply preservation are explicit in `SPEC.md` and
`work-item.yaml`.
