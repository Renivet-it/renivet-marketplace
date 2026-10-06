# REVIEW: REN-262 — [PRE-RD-5][Corporate] End-to-end payment/order integrity: atomic capture, balance binding, idempotency and recovery

## Executive Result

`REVIEW_FAILED` with `MATERIAL_DRIFT`. The approved contract is present and valid, but the current working-tree implementation does not yet satisfy the atomic reconciliation, webhook completion, operator recovery, and concurrency evidence required by REN-262. Governance re-entry is required.

Comparison base: `origin/master` merge-base `c8e1ecb30045edb19673217d53ec24910ef7683b`.
Git head: `c8e1ecb30045edb19673217d53ec24910ef7683b` plus the uncommitted REN-262 working-tree changes. No PR exists yet.

## Review Scope and Git Evidence

Reviewed the approved REN-262 contract, Linear issue and relations, the current staged/unstaged diff, and the surrounding Corporate payment/order/document paths. Changed implementation areas include `corporate-payment.ts`, `corporate-payment-integrity.ts`, `corporate-order.ts`, `corporate-payment-request.tsx`, the Corporate Razorpay webhook route, the REN-262 migration, and the focused REN-262 test.

## Requirement Reconciliation

- REQ-262-001: `PASS` for durable intents before provider order creation in advance, balance, and payment-request checkout paths; evidence: `corporate-order.ts`, `corporate-payment-request.tsx`, `corporate-payment.ts`.
- REQ-262-002: `PASS` for browser confirmation provider fetch and exact identity/amount/currency/status checks; webhook uses the same binding checks; evidence: `corporate-payment-integrity.ts`, Corporate webhook route.
- REQ-262-003: `FAIL`; order/payment/status/receipt/proforma writes remain separate in `confirmAdvancePayment` and `confirmBalancePayment`, and webhook completion stops at `payment_received` rather than applying the Corporate economic outcome.
- REQ-262-004: `FAIL`; provider-payment uniqueness is added, but lookup-before-insert and reads outside the transaction remain in `applyVerifiedPayment`, with no tested transactional claim/convergence boundary across browser and webhook paths.
- REQ-262-005: `FAIL`; signed webhook detection exists, but there is no authorized operator recovery action/report and no webhook path that completes provider-paid/no-order recovery.
- REQ-262-006: `PARTIAL`; signature/provider mismatch and over-balance rejection are covered, but partial/overpayment refund execution and expiry/recovery transitions are not implemented end to end.
- REQ-262-007: `PARTIAL`; intent status/rejection fields exist, but orphan monitoring, retry counts, and provider-paid/no-order operational reporting are not implemented.

## Scenario Reconciliation

- SCN-262-001: `PARTIAL`; advance intent and verification exist, but durable completion is not atomic.
- SCN-262-002: `PARTIAL`; balance intent binding exists, but concurrent finalization is not proven.
- SCN-262-003: `PARTIAL`; payment-request intent binding exists, but active-intent replacement and concurrency are not fully guarded.
- SCN-262-004: `PASS` for server-side pre-capture validation in the reviewed checkout paths.
- SCN-262-005: `FAIL`; webhook records recovery state but does not complete lost-callback application or provide operator recovery.
- SCN-262-006: `PARTIAL`; exact mismatch/over-balance rejection exists, but refund behavior is not wired.
- SCN-262-007: `FAIL`; no database-backed concurrent confirmation test or shared atomic transition proves one economic outcome.
- SCN-262-008: `FAIL`; document/provider/database partial failure remains capable of leaving a paid order without a durable retryable completion record.

## Invariant Reconciliation

- INV-262-001: `PASS` for new checkout intent creation, but legacy/manual paths are not unified.
- INV-262-002: `PARTIAL`; intent and payment-reference uniqueness exist, but Corporate payment insertion still relies on lookup-before-insert behavior.
- INV-262-003: `PASS` for browser/provider verification; broader manual/recovery completion is incomplete.
- INV-262-004: `FAIL`; current multi-write confirmation can still separate order payment state from payment/document writes.
- INV-262-005: `PARTIAL`; existing document helpers are idempotent, but their calls are outside the payment transition.
- INV-262-006: `FAIL`; recovery does not yet complete from the immutable intent snapshot.
- INV-262-007: `PASS` for the new verifier and webhook response paths; no secrets are intentionally logged.

## Flow and Architecture Review

The dedicated Corporate intent boundary matches DEC-262-001 and the approved architecture. Provider verification is centralized for browser confirmations. However, the shared reconciliation service described by FLOW-262-001 through FLOW-262-003 is not implemented: the existing Corporate order and payment-request services still own separate mutation sequences, and the webhook only updates intent state. The migration is additive and preserves the REN-255 general-order foreign-key boundary.

## Security and Integration Review

Signature, provider order/payment identity, amount, currency, and captured status are checked server-side. Customer ownership checks remain in the existing service paths. Razorpay webhook signature verification is present. Integration coverage is incomplete because webhook acknowledgement is not coupled to durable Corporate application, refund calls are not wired for excess payment, and no authorized operator recovery route exists.

## Scope and Drift Review

`MATERIAL_DRIFT`: the implementation adds the approved schema and verification boundary, but omits approved behavior required for atomic/retryable completion, operator recovery, and concurrency-safe convergence. This requires SPEC/implementation governance re-entry; the approved contract must not be weakened to match the partial implementation.

## Test Expectation Review

- TEXP-262-001: `PARTIAL`; pure binding rules are tested, but lifecycle/overpayment refund transitions are not.
- TEXP-262-002: `PARTIAL`; migration/schema is present, but no database uniqueness and rollback integration test is present.
- TEXP-262-003: `PARTIAL`; entry-point wiring is present, but no shared reconciliation service drives all paths.
- TEXP-262-004: `PARTIAL`; no Razorpay Test Mode evidence for webhook recovery, replay, concurrency, or wrong binding.
- TEXP-262-005: `PARTIAL`; server binding is covered statically, but operator authorization/recovery is absent.
- TEXP-262-006: `PARTIAL`; existing regression suite passes statically/runtime, but Corporate transition compatibility is not fully exercised.
- TEXP-262-007: `FAIL`; finance-approved refund and recovery evidence is not implemented.
- TEXP-262-008: `FAIL`; no concurrency/retry performance evidence exists.

## Findings

### REV-001

- Severity: BLOCKER
- Category: requirement
- Description: Corporate payment/order/document application is not one atomic or explicit retryable transition.
- Evidence: REQ-262-003, INV-262-004, `src/lib/services/corporate-order.ts` `confirmAdvancePayment`/`confirmBalancePayment`, and `src/lib/services/corporate-payment-request.tsx` `applyVerifiedPayment`.
- Impact: Provider-paid state can still diverge from Corporate order, payment, receipt, or proforma state.
- Recommendation: Implement one transaction-scoped reconciliation/claim service with durable completion states and idempotent document effects.

### REV-002

- Severity: BLOCKER
- Category: recovery
- Description: Corporate webhook recovery stops at `payment_received`/`recovery_required` and does not apply or expose authorized operator recovery.
- Evidence: REQ-262-005, SCN-262-005, `src/app/api/webhooks/razorpay/corporate-payments/route.ts`.
- Impact: A lost browser callback can remain provider-paid without a completed Corporate order/payment outcome.
- Recommendation: Route webhook and operator recovery through the shared reconciler; add finance/admin authorization and immutable-intent reconstruction.

### REV-003

- Severity: BLOCKER
- Category: invariant
- Description: Concurrency safety is incomplete despite provider reference uniqueness.
- Evidence: REQ-262-004, SCN-262-007, `applyVerifiedPayment` reads duplicate/collected state before its transaction and the REN-262 tests contain no concurrent database claim test.
- Impact: Concurrent callbacks can still race on outstanding amount and downstream effects.
- Recommendation: Claim provider payment and lock/recheck the Corporate order inside the transaction; add duplicate/concurrent browser/webhook integration tests.

### REV-004

- Severity: HIGH
- Category: test
- Description: Required external, database, recovery, and refund evidence is not present.
- Evidence: TEXP-262-002, TEXP-262-004, TEXP-262-007, TEXP-262-008; current `tests/ren-262-corporate-payment-integrity.test.ts` is pure/static and does not exercise PostgreSQL or Razorpay Test Mode.
- Impact: The critical financial failure modes remain unproven before release.
- Recommendation: Add non-production PostgreSQL and Razorpay Test Mode tests for rollback, replay, concurrency, lost callback, refund, and operator recovery.

## Decisions Requiring Attention

None; the approved Class C decisions were respected. The blockers are missing implementation/evidence, not new policy decisions.

## Final Recommendation

`REVIEW_FAILED`. Keep REN-262 in `IN_REVIEW`, implement REV-001 through REV-004, rerun the required integration evidence, and rerun `renivet-review REN-262` before creating or merging a PR.
