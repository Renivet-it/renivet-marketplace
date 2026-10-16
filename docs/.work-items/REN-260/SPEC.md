# REN-260 — C0-R3 Bounded Payout Safety Remediation

## Scope

Implement only the three residual blockers identified by the independent C0-R2 review:

1. H-1 cross-cycle duplicate payout containment.
2. Manual payout completion safety.
3. F-1/N-1 recalculation and approval race protection.

The implementation baseline is `akshayatwork1/ren-253-c0-r2-payout-safety` at
`39fba3d1274d75802c7b38b44b16d08839e0f5ee`. Existing C0 controls must remain intact.

## Required behavior

- Claim a cycle before provider execution, perform a fresh post-claim overlap check,
  and refuse execution if an overlapping cycle is in flight. Release the claim with
  compare-and-set semantics; if release fails, keep the cycle processing and do not
  call the provider.
- Manual completion must require the allowed cycle state, awaiting-manual-confirmation
  status, expected payout basis, confirmer/executor separation, evidence, a validated
  human banking reference, and a unique non-provider-shaped transaction reference.
  The write must be compare-and-set protected and must not overwrite newer provider
  state or make bookkeeping failure look like payment failure.
- Recalculation must use one cycle snapshot, conditionally update the exact stored
  calculation summary before replacing line items, and invalidate approval when payout
  authority or order membership changes.

## Hard boundaries

No schema or migration, payout architecture redesign, provider/webhook redesign,
production data mutation, deployment, merge, or money movement. Stop if existing
columns cannot represent the controls safely.

## Verification expectations

Test concurrent overlap, forced mutual abort, CAS release failure, manual completion
authorization and stale writes, provider/manual interaction, concurrent approval during
recalculation, authority changes, order-membership changes, unchanged authority
preservation, and realistic summary sizes. Existing baseline failures must remain
unchanged. Independent review, non-production Postgres concurrency evidence,
RazorpayX Test Mode evidence, staging validation, and human release approval remain
post-implementation gates.
