# REVIEW: REN-131 — Add server-side purchase_completed capture (no PostHog fallback today)

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `NO_DRIFT`; governance re-entry is not required. The server emits one failure-isolated PostHog purchase event after the complete checkout order-creation loop, and the two browser PostHog purchase emitters were removed. Base: `4943c40a46901692fb7f77c3bf1259530303798a`; head: `8a5c8a4aa89c33d20f16ac88e4e6285de94a1a9f`.

## Review Scope and Git Evidence

- Compared `origin/master` merge-base `4943c40a46901692fb7f77c3bf1259530303798a` to `HEAD` `8a5c8a4aa89c33d20f16ac88e4e6285de94a1a9f`.
- The worktree was clean at review time; no PR URL was available.
- Changed implementation paths are the order route, purchase-event helper/test, add-to-cart hook, and the two checkout components.

## Requirement Reconciliation

- REQ-131-001: PASS. `ordersRouter.createOrder` invokes `capturePurchaseCompleted` after the full per-item persistence loop.
- REQ-131-002: PASS. The helper emits once per checkout and catches PostHog failures without throwing into the mutation.
- REQ-131-003: PASS. `purchase-events.ts` allowlists checkout/order/product/brand/value/currency/item/payment-method fields and excludes addresses, payment identifiers, and credentials.
- REQ-131-004: PARTIAL. Focused regression tests cover split aggregation, allowlisting, failure isolation, and client overlap statically; route-level normal/failure/reward integration coverage remains a follow-up.

## Scenario Reconciliation

- SCN-131-001: PASS. Capture is placed after persisted orders are collected.
- SCN-131-002: PASS. `orderIds`, product IDs, brand IDs, and totals are aggregated into one event.
- SCN-131-003: PASS for the helper boundary; PARTIAL for live route retry/transaction behavior because no route integration harness was added.
- SCN-131-004: PASS for zero-value support and minimal properties; identity is the authenticated user ID.

## Invariant Reconciliation

- INV-131-001: PASS. No capture occurs before the order loop has produced persisted orders.
- INV-131-002: PASS. Capture exceptions are caught and reduced to a non-sensitive error name.
- INV-131-003: PASS. The payload contains no payment credentials, address data, or contact PII.

## Flow and Architecture Review

- FLOW-131-001: PASS. The order route persists orders, then calls the shared server PostHog client through the failure-isolated helper.
- FLOW-131-002: PASS. `input.intentId` is used as checkout identity; the persisted order IDs provide a deterministic fallback when no intent is available.
- The client purchase PostHog calls were removed from `checkout-content.tsx` and `order-payment-page.tsx`, while the separate Meta calls remain.

## Security and Integration Review

- SEC-131-001: PASS. The event uses `user.id` and minimal commerce metadata only.
- INT-131-001: PASS at the SDK boundary. The shared `posthog-node` client is used and SDK failures are contained; cross-request delivery/flush behavior remains provider-managed.
- INT-131-002: PASS. Order and payment code remains unchanged apart from the non-blocking analytics call.
- DEP-131-001 and DEP-131-002: PASS based on the route placement and existing shared client.

## Scope and Drift Review

`NO_DRIFT`. The changes stay within approved server capture, client overlap removal, safe properties, and regression coverage. No schema, migration, dependency, payment, address, or historical analytics changes were introduced.

## Test Expectation Review

- TEXP-131-001: PARTIAL. Static tests cover the capture helper and failure isolation; route-level persistence ordering is evidenced by placement but not exercised through an integration harness.
- TEXP-131-002: PASS for preserved client Meta behavior and unchanged order side effects by diff inspection.
- TEXP-131-003: PASS for split and zero-value-compatible payload construction; live business UAT remains manual.
- TEXP-131-004: PASS for the allowlisted payload and absence of sensitive fields in the helper contract.

## Findings

### REV-131-001

- Severity: LOW
- Category: test
- Description: Route-level integration coverage for normal, failed, retry, and reward order flows is not present in the repository test suite.
- Evidence: TEXP-131-001 and TEXP-131-002; `src/lib/analytics/purchase-events.test.ts` covers the helper and source boundary, while `ordersRouter.createOrder` is not integration-tested.
- Impact: A future change to route placement could regress the persistence ordering without a focused test detecting it.
- Recommendation: Add a route integration seam or test fixture covering persisted split/reward orders and PostHog failure isolation.

## Decisions Requiring Attention

None.

## Final Recommendation

Accept the implementation with the low-severity test follow-up above. No governance re-entry is required; complete live PostHog dashboard/UAT comparison separately before relying on the new event as the production reporting baseline.
