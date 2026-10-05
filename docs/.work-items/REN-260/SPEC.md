# REN-260 ? C0-R3 Payout Safety Remediation

## Scope

Close the three residual REN-253 C0-R2 gaps:

1. H-1 cross-cycle duplicate payout containment.
2. Manual payout completion safety.
3. F-1/N-1 recalculation and approval race protection.

The approved implementation baseline is the R2 payout-safety branch. Existing C0
controls remain in scope and must not be weakened.

## Required behavior

- Claim a payout cycle before provider execution, then perform a fresh overlap
  check. On overlap, audit and refuse execution. Release the claim using exact
  compare-and-set semantics; if release fails, keep the cycle `processing` and do
  not call the provider.
- Manual completion requires a processing cycle, an awaiting-manual-confirmation
  brand, current expected basis, confirmer distinct from executor, evidence,
  validated human banking reference, duplicate-reference prevention, and an
  exact-summary CAS write. Manual completion must not overwrite provider outcomes.
- Recalculation uses one cycle snapshot, conditionally persists the exact stored
  calculation summary before replacing line items, and invalidates approval when
  payout authority or order membership changes.

## Boundaries

No schema or migration changes, provider/webhook redesign, payout architecture
redesign, production data mutation, deployment, merge, or money movement.

## Verification

- Focused regression and concurrency tests.
- Non-production Postgres concurrency evidence.
- RazorpayX test-mode evidence.
- Staging validation.
- Independent L3 review and human release approval.
