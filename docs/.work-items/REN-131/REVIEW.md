# REVIEW: REN-131 — Add server-side purchase_completed capture (no PostHog fallback today)

## Executive Result

`REVIEW_FAILED`; `MATERIAL_DRIFT`; governance re-entry is required. Base commit: `4943c40a46901692fb7f77c3bf1259530303798a`. Reviewed head commit: `1fce19a99a736686d147478d2d8a37fea993cc2d`.

The implementation does not satisfy the approved one-event-per-complete-checkout decision. The storefront splits one checkout into one `createOrder` mutation per brand, while the server capture executes once at the end of each mutation.

## Review Scope and Git Evidence

- Compared the `origin/master` merge base to the current feature-branch head; the worktree was clean before this review update and no PR URL was available.
- Reviewed `ordersRouter.createOrder`, both checkout callers, `createRazorpayPaymentOptions`, the purchase helper, and its test.
- `buildOrderDetailsByBrand` returns one request payload per brand in both checkout components.
- Online checkout iterates `orderDetailsByBrand` in `createRazorpayPaymentOptions`; COD and reward checkout also iterate the array directly.

## Requirement Reconciliation

- REQ-131-001: FAIL. Capture occurs after one brand request persists, not after the complete multi-brand checkout persists.
- REQ-131-002: FAIL. Online brand requests reuse the same intent `$insert_id`, potentially retaining only one partial event; COD/reward requests can use different fallback IDs and emit multiple events. Client retry can repeat server capture.
- REQ-131-003: PASS. The helper uses an allowlisted payload and excludes payment credentials, addresses, and contact PII.
- REQ-131-004: FAIL. The test constructs a synthetic multi-order helper input but does not exercise the actual per-brand request orchestration that contradicts the approved policy.

## Scenario Reconciliation

- SCN-131-001: PARTIAL. A single-brand request emits after its local persistence loop.
- SCN-131-002: FAIL. A multi-brand checkout is multiple mutations and therefore is not aggregated by the server helper.
- SCN-131-003: FAIL. Mutation retry can reattempt capture, and identical online `$insert_id` values can deduplicate distinct partial payloads rather than a complete checkout payload.
- SCN-131-004: PARTIAL. Zero-value payloads are representable, but reward flows do not consistently carry a shared checkout intent.

## Invariant Reconciliation

- INV-131-001: FAIL. A brand-level event can be emitted before later brand orders in the same checkout are attempted.
- INV-131-002: FAIL. Synchronous SDK errors are contained, but retry and multi-request behavior can duplicate or undercount the business purchase.
- INV-131-003: PASS. Sensitive payment/address fields are excluded.

## Flow and Architecture Review

- FLOW-131-001: PARTIAL. The helper is correctly placed after persistence inside one mutation but the mutation is not the complete checkout boundary.
- FLOW-131-002: FAIL. The approved business unit is checkout; the implementation aggregates only the items passed to one brand request.
- DEP-131-001: FAIL. The caller’s per-brand request architecture was not incorporated into the event design.
- DEP-131-002: PARTIAL. The shared PostHog client is used, but `$insert_id` semantics are applied to incomplete payloads.

## Security and Integration Review

- SEC-131-001: PASS. The payload contains authenticated user ID and minimal commerce metadata.
- INT-131-001: FAIL for idempotency and aggregation; capture failures are synchronously contained.
- INT-131-002: FAIL. The order-intent identifier spans online brand requests, but the event payload does not span those requests; COD/reward do not consistently pass that identifier.

## Scope and Drift Review

`MATERIAL_DRIFT`. DEC-131-001 and BR-131-001 require one complete-checkout event. The implementation instead produces brand-request events with inconsistent deduplication behavior. Task status must return to `IN_REVIEW`.

## Test Expectation Review

- TEXP-131-001: FAIL. No integration test exercises the real checkout-to-multiple-mutations path.
- TEXP-131-002: PARTIAL. Client Meta calls are preserved, but retry behavior is not protected.
- TEXP-131-003: FAIL. The synthetic split test passes multiple order IDs directly to the helper and therefore does not detect the actual brand split above the route.
- TEXP-131-004: PASS. The helper payload is allowlisted.

## Findings

### REV-131-001

- Severity: LOW
- Category: test
- Description: Route-level integration coverage for normal, failed, retry, and reward order flows is absent.
- Evidence: TEXP-131-001 and `src/lib/analytics/purchase-events.test.ts`.
- Impact: Request-boundary regressions are not detected.
- Recommendation: Add checkout-orchestration coverage spanning multiple brand requests.

### REV-131-002

- Severity: BLOCKER
- Category: requirement
- Description: The server emits per brand request instead of once per complete checkout.
- Evidence: DEC-131-001, BR-131-001, FLOW-131-002; `buildOrderDetailsByBrand` in both checkout components; the loops in `createRazorpayPaymentOptions` and COD/reward handlers; `capturePurchaseCompleted` in `ordersRouter.createOrder`.
- Impact: Online analytics can retain one incomplete brand payload under a shared `$insert_id`; COD/reward can emit multiple purchase events and overstate purchases/revenue.
- Recommendation: Move aggregation/capture to a true checkout-completion boundary or persist a checkout-level outbox/idempotency record that emits exactly once after every brand order succeeds.

## Decisions Requiring Attention

None. The required business decision was already resolved by DEC-131-001; the implementation contradicts it.

## Final Recommendation

Do not merge REN-131 in its current form. Re-enter implementation governance, correct the checkout-level boundary and idempotency behavior, add orchestration coverage, then rerun review.
