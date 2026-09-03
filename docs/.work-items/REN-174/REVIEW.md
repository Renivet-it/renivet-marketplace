# REVIEW: REN-174 — Inventory double-decremented on order cancellation

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `NO_DRIFT`; governance re-entry is not required. The approved relative-delta cancellation contract and database-side zero floor are implemented. One non-blocking test-coverage finding remains for database-seeded end-to-end cancellation assertions.

## Review Scope and Git Evidence

Compared the tracked `master` merge-base commit `d88e9ac5c762504d48c58967c12f73ff3c7c773a` with implementation commit `02f6afc3884acf2d05cbeae559249167286b07ad` on branch `ayanganguly333/ren-174-inventory-double-decremented-on-order-cancellation`. No PR exists (`pr_url: null`). The diff includes the REN-174 specification artifacts, implementation plan, the shared product/variant stock mutation, both cancellation callers, and focused regression tests. No schema, migration, webhook order-creation, authorization, refund, shipment, or status-transition code was changed.

## Requirement Reconciliation

- `REQ-001`: PASS. `src/lib/db/queries/product.ts` keeps the shared mutation relative and subtracts the supplied item delta for both product and variant rows.
- `REQ-002`: PASS. `src/lib/trpc/routes/general/orders.ts` now passes `item.quantity` for customer cancellation.
- `REQ-003`: PASS. `src/lib/support/cancel-order-helper.ts` now passes `item.quantity` for admin/support cancellation.
- `REQ-004`: PASS. Both product and variant updates use `GREATEST(current_quantity - delta, 0)`.
- `REQ-005`: PASS. The diff does not alter order-creation callers or `src/app/api/webhooks/razorpay/payments/route.ts`.
- `REQ-006`: PASS. Existing cancellation flow, refund/shipment handling, authorization boundaries, and error handling remain outside the changed hunks.
- `REQ-007`: PASS. Existing product/variant identity predicates and transaction result handling are unchanged.

## Scenario Reconciliation

- `SCN-001` and `SCN-002`: PARTIAL. The customer cancellation caller now supplies the exact relative item quantity; the focused test checks this source contract, but no database-seeded runtime test is available in the current test seams.
- `SCN-003`: PARTIAL. The admin/support caller uses the same relative contract; runtime database restoration is not directly exercised.
- `SCN-004`: PASS. The focused regression test checks the zero-floor SQL expression for both inventory identities.
- `SCN-005`: PASS. Order creation and the Razorpay webhook are absent from the implementation diff and retain their existing decrement calls.
- `SCN-006`: PASS. The protected cancellation authorization code is unchanged.
- `SCN-007`: PASS. Refund, shipment, order-state, and error-boundary code is unchanged in the reviewed diff.
- `SCN-008`: PASS. Existing row identity predicates remain unchanged; no unrelated-row update path was introduced.

## Invariant Reconciliation

- `INV-001`–`INV-007`: PASS. The shared mutation remains relative, cancellation passes one item delta, the zero floor prevents negative persistence, IDs remain scoped, authorization is unchanged, order creation remains decrement-only, and operational transitions are untouched.

## Flow and Architecture Review

- `FLOW-001`: PASS. Customer cancellation reaches the existing stock mutation with the relative item quantity and the shared transaction floors the result.
- `FLOW-002`: PASS. Admin/support cancellation uses the same delta contract and preserves its existing operational boundary.
- `FLOW-003`: PASS. Order creation, including the active Razorpay webhook path, remains unchanged.
- `DEP-001`–`DEP-002`: PASS. Existing transaction/reconciliation behavior is preserved; REN-144 remains coordination-only.
- `INT-001`–`INT-005`: PASS. Product, variant, customer cancellation, admin/support cancellation, and Razorpay order-creation boundaries remain compatible.

## Security and Integration Review

- `SEC-001`–`SEC-002`: PASS. No authorization or permission boundary was changed.
- Refund, shipment, status, and stock-error behavior remains unchanged in the reviewed hunks, satisfying the approved integration boundaries.
- No external API, schema, migration, credential, or production configuration change was introduced.

## Scope and Drift Review

`NO_DRIFT`. The implementation is limited to the approved cancellation arithmetic correction, shared zero floor, focused tests, and task-local planning/review artifacts. No unapproved behavior or public interface change was observed.

## Test Expectation Review

- `TEXP-001`: PASS by focused source-contract test for product and variant relative subtraction.
- `TEXP-002` and `TEXP-003`: PARTIAL; both callers are covered statically, but database-seeded integration assertions are not present.
- `TEXP-004`: PASS by focused zero-floor expression test.
- `TEXP-005`: PASS by unchanged order-creation/webhook diff evidence.
- `TEXP-006` and `TEXP-007`: PASS by unchanged authorization and operational boundaries.
- `TEXP-008`: PARTIAL/OPTIONAL; concurrency and retry/idempotency remain coordinated with REN-144 as approved by the Critic.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: Database-seeded end-to-end tests proving exact stock restoration for both cancellation paths are not available in the current repository test seams.
- Evidence: `TEXP-002`/`TEXP-003`; `src/lib/inventory/cancellation-stock.test.ts` checks both caller deltas and the shared SQL floor, while the changed callers are `src/lib/trpc/routes/general/orders.ts` and `src/lib/support/cancel-order-helper.ts`.
- Impact: Runtime database behavior is supported by direct implementation evidence but has less direct regression coverage than the approved test expectation requests.
- Recommendation: Add database-seeded integration coverage when the repository exposes a stable test database/query seam; no code change is required for this review.

## Decisions Requiring Attention

None.

## Final Recommendation

The implementation is consistent with the approved REN-174 contract and should proceed without governance re-entry. Run the repository test suite and governance validator before integration; add the missing database-seeded cancellation tests when the test infrastructure supports them.
