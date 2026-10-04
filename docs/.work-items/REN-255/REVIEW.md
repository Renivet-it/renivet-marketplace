# REVIEW: REN-255 — [RD-1] Slice 1 — Order & Payment Truth

## Executive Result

Result: `REVIEW_FAILED`.

The implementation adds useful payment identity/amount validation, a durable event receipt claim, and a fail-closed payment-ID lookup fallback, but it does not yet satisfy the approved order-intent bridge, atomic payment transition, bounded cutover/rollback, or required provider/integration evidence. The existing Razorpay refund webhook remains owned by REN-226 and is not reimplemented here. Drift is `MATERIAL_DRIFT`; governance re-entry is required.

Base branch: `origin/master`  
Base commit: `e6ebd297ecbc09ad283d3e5b2e850d1d9f7876be`  
Head commit: `e6ebd297ecbc09ad283d3e5b2e850d1d9f7876be`  
PR URL: `null`  
Working tree: uncommitted implementation and governance changes are present; the comparison therefore includes the working-tree diff in addition to the equal base/head commits.

## Review Scope and Git Evidence

Reviewed the approved `docs/.work-items/REN-255/SPEC.md`, `work-item.yaml`, `CRITIQUE.md`, the working-tree diff, and surrounding payment/order/refund code. Changed implementation paths include `src/app/api/webhooks/razorpay/payments/route.ts`, `src/lib/payments/payment-reconciliation.ts`, `src/lib/db/schema/payment-event.ts`, `src/lib/db/queries/payment-event.ts`, `src/lib/validations/razorpay-webhook.ts`, and `drizzle/0291_ren255_payment_event_receipts.sql`. The task-local test is `tests/ren-255-payment-reconciliation.test.ts`.

## Requirement Reconciliation

- `REQ-255-001`: PARTIAL. The payment webhook binds `paymentEntity.order_id` to `existingOrder.id`, and `processOrderAfterPayment` now performs provider-side reconciliation, but the approved checkout/order-intent bridge for new events is not implemented.
- `REQ-255-002`: PARTIAL. `reconcilePaymentBinding` compares provider order ID, payment ID when already present, exact paise amount, and currency before the payment transition in both changed payment entry points; refund identity remains governed by REN-226.
- `REQ-255-003`: PARTIAL. `payment_event_receipts` has a unique provider/event/payment/order key and the webhook claims before stock/order effects. Atomic transition and complete effect recovery are not demonstrated.
- `REQ-255-004`: PASS for REN-255 scope. The payment route continues using `refundQueries.recordRefundEvent`, and the existing Razorpay refund webhook remains the REN-226 canonical boundary; REN-255 does not duplicate or replace it.
- `REQ-255-005`: PARTIAL. Direct provider-order lookup plus unique payment-ID compatibility fallback and ambiguity rejection are implemented, but bounded cutover, rollback, and migration observability are not.
- `REQ-255-006`: PARTIAL. The helper and receipt store paise and currency, but no canonical payment outcome exposes `transactionAmountPaise` with provenance for RD-2.
- `REQ-255-007`: PARTIAL. Signature parsing and mismatch rejection remain fail-closed, and failed claims can now be marked rejected and retried; atomic partial-failure recovery is not complete.
- `REQ-255-008`: PARTIAL. Static tests were added, but staging Razorpay Test Mode evidence is not part of this implementation diff.

## Scenario Reconciliation

- `SCN-255-001`: PARTIAL — legacy direct order binding is covered; approved new binding and full transition path are not.
- `SCN-255-002`: PASS for the changed webhook reconciliation helper; unknown/ambiguous lookup and all side-effect paths are not covered.
- `SCN-255-003`: PARTIAL — duplicate claim suppression is present, but no complete effect/recovery proof exists.
- `SCN-255-004`: PARTIAL — database uniqueness exists; concurrent PostgreSQL evidence and atomic state transition are absent.
- `SCN-255-005`: PASS by compatibility boundary. The existing REN-226 refund webhook and canonical writer are preserved; refund-path regression testing remains a release obligation, not new REN-255 implementation.
- `SCN-255-006`: PARTIAL — direct provider lookup and unique payment-ID compatibility fallback are present; explicit order-intent cutover and rollback remain.
- `SCN-255-007`: PARTIAL — failed claims now move to a retryable rejected state, but stock/order partial failure is not atomic and still needs recovery proof.
- `SCN-255-008`: PARTIAL — paise/INR storage exists, but the canonical RD-2 outcome/provenance contract is absent.
- `SCN-255-009`: PARTIAL — `processOrderAfterPayment` now fetches the provider payment, checks authenticated order ownership, and uses the reconciliation/receipt boundary; the full atomic transition remains incomplete.

## Invariant Reconciliation

- `INV-255-001`: PARTIAL; provider binding is checked in the webhook and server-action paths, but the approved order-intent bridge is absent.
- `INV-255-002`: PARTIAL; receipt uniqueness exists, but canonical business identity across all paths is incomplete.
- `INV-255-003`: PASS for the changed payment webhook path.
- `INV-255-004`: PARTIAL; duplicate webhook delivery is suppressed before stock, but transaction/effect recovery is incomplete.
- `INV-255-005`: PASS; REN-226 is not reimplemented.
- `INV-255-006`: PARTIAL; compatibility fallback and ambiguity rejection exist, but migration rollback is absent.
- `INV-255-007`: PARTIAL; signature and secret boundaries remain intact and rejected receipts are retryable, but the full invalid/partial-failure audit path is incomplete.
- `INV-255-008`: PARTIAL; exact paise/INR fields exist, but provenance and canonical consumer contract are absent.

## Flow and Architecture Review

`FLOW-255-001` is partially implemented in the payment webhook: signature, parse, direct/compatibility binding, receipt claim, then business effects. `FLOW-255-002` has the unique claim/replay shape, but the applied transition is not atomic with stock/order mutation. `FLOW-255-003` and `FLOW-255-004` are not implemented by this diff. The server action now uses the same reconciliation helper and receipt query, but both paths still need the approved lookup bridge and complete transaction/recovery boundary.

## Security and Integration Review

`SEC-255-001` remains satisfied in the payment route because signature validation precedes the new claim. `SEC-255-002` is partially satisfied: `processOrderAfterPayment` now rejects unauthenticated callers and verifies the fetched provider payment, but the approved server-side checkout/order-intent bridge is absent. `SEC-255-003` is partially satisfied because the lookup now has a unique payment-ID fallback, but the approved order-intent bridge is absent. `SEC-255-004` is satisfied by the metadata written here; no secret is persisted.

For `INT-255-001` and `INT-255-002`, the receipt schema and unique index provide a useful database boundary, but no provider-path/concurrency staging evidence is present and the order transition is separate from the claim transaction. `INT-255-003` is only partial: the claim precedes stock and order effects, while external effects remain in the route and there is no complete retry/outbox or stuck-receipt recovery behavior.

## Scope and Drift Review

The changed files are broadly within the approved payment/order scope. However, the implementation materially changes the payment webhook behavior without implementing the approved cross-path architecture and migration contract. This is `MATERIAL_DRIFT`, not a cosmetic implementation variation, because it changes the approved identity flow, state-transition boundary, and required integration behavior.

## Test Expectation Review

- `TEXP-255-001`: PARTIAL — deterministic helper tests cover identity, amount, currency, and payment-ID mismatch.
- `TEXP-255-002`: PARTIAL — schema/query code provides a unique claim, but no PostgreSQL concurrency/integration test is present.
- `TEXP-255-003`: PARTIAL — payment webhook claim ordering and server-action reconciliation are statically covered; existing REN-226 refund API/webhook behavior still needs regression execution.
- `TEXP-255-004`: PARTIAL — no Razorpay Test Mode staging evidence is included; the required refund check is regression validation of the existing REN-226 path, not a new refund implementation.
- `TEXP-255-005`: PARTIAL — existing signature path is preserved and mismatch tests exist; complete fail-closed/recovery coverage is absent.
- `TEXP-255-006`: PARTIAL — no regression evidence covers the full payment/refund/order side-effect graph.
- `TEXP-255-007`: FAIL — no business UAT evidence for migration, rollback, monitoring, or amount provenance.
- `TEXP-255-008`: NOT_APPLICABLE to this static review; performance evidence remains a release obligation.

## Findings

### REV-001

- Severity: BLOCKER
- Category: requirement
- Description: The approved checkout/order-intent binding and full migration controls are not implemented; the route currently uses direct provider-order lookup plus a unique payment-ID compatibility fallback.
- Evidence: `REQ-255-001`, `REQ-255-005`, `SCN-255-006`, `FLOW-255-004`; `src/app/api/webhooks/razorpay/payments/route.ts` around the direct lookup and `getOrderIdsByPaymentId` fallback; no cutover/rollback telemetry is present.
- Impact: New and legacy events do not follow the approved canonical identity contract, risking payment-to-order misbinding during migration.
- Recommendation: Implement and test the approved order-intent bridge, bounded legacy fallback, ambiguity rejection, cutover, rollback, and observability before re-review.

### REV-002

- Severity: BLOCKER
- Category: architecture
- Description: Although `processOrderAfterPayment` now uses provider reconciliation and the receipt query, claim/order/stock state transitions are not one atomic database boundary.
- Evidence: `CRIT-255-005`, `DEC-255-006`, `SCN-255-004`, `SCN-255-009`; `src/actions/process-order-after-payment.ts`; the webhook calls `paymentEventQueries.claim`, then separate `productQueries.updateProductStock` and `orderQueries.updateOrderStatus`.
- Impact: Browser/server-action payment transitions can bypass the new checks, and a partial failure can leave a claimed event with inconsistent fulfilment state.
- Recommendation: Keep both entry points on the shared reconciliation service and implement the approved transactional transition or an explicitly approved durable recovery mechanism.

### REV-003

- Severity: HIGH
- Category: integration
- Description: Required provider-path, concurrency, retry, and staging Test Mode evidence is absent; the existing REN-226 refund path also needs regression execution.
- Evidence: `TEXP-255-002`, `TEXP-255-004`, `TEXP-255-006`, `TEXP-255-007`; only `tests/ren-255-payment-reconciliation.test.ts` static/helper assertions are present, while `tests/ren-226-refund-source-of-truth.test.ts` verifies the preserved canonical refund wiring.
- Impact: The financial and inventory safety claims cannot be released based on the current evidence.
- Recommendation: Add PostgreSQL integration coverage and execute the approved staging Razorpay Test Mode matrix for payment duplicate/concurrent/retry/partial-failure behavior, plus regression validation of the existing REN-226 refund webhook.

### REV-004

- Severity: HIGH
- Category: state/data consistency
- Description: Receipt rejection and retry are now implemented, but stock/order state transitions remain separate from the receipt claim and can still partially apply.
- Evidence: `REQ-255-007`, `SCN-255-007`, `INT-255-002`; `src/lib/db/queries/payment-event.ts` and `payments/route.ts`.
- Impact: A failure after stock mutation but before order transition can still require reconciliation and could duplicate stock mutation on retry.
- Recommendation: Put stock, order, and receipt state transitions behind one atomic or explicitly compensating transaction boundary, then prove it with failure-injection tests.

## Decisions Requiring Attention

None beyond the approved design decisions. The missing items are contract obligations, not new discretionary decisions.

## Final Recommendation

Do not merge or release this implementation yet. Keep the task in governance re-entry, complete REV-001 through REV-004, rerun the required staging and integration evidence, then rerun `renivet-review REN-255` against a committed comparison base.
