# REVIEW: REN-132 — Reconcile add_to_cart vs cart_added (4.3x discrepancy)

## Executive Result

`REVIEW_FAILED`; `MATERIAL_DRIFT`; governance re-entry is required. Base commit: `4943c40a46901692fb7f77c3bf1259530303798a`. Reviewed head commit: `1fce19a99a736686d147478d2d8a37fea993cc2d`.

The client PostHog event was removed and authenticated server `cart_added` retained, but the approved guest, retry, and failure semantics were not implemented or documented.

## Review Scope and Git Evidence

- Compared the `origin/master` merge base to the current feature-branch head; the worktree was clean before this review update and no PR URL was available.
- Reviewed `useAddToCartTracking`, all discovered hook consumers, `cartRouter.addProductToCart`, and the focused source test.
- The canonical server route is a `protectedProcedure`; guest carts remain client-side and cannot emit its event.

## Requirement Reconciliation

- REQ-132-001: PARTIAL. `cart_added` is the only remaining PostHog add event in these paths, but its reporting denominator excludes guest carts without an explicit reporting definition.
- REQ-132-002: FAIL. Guest adds have no canonical event, server retries have no event identity, and PostHog capture is not failure-isolated after persistence.
- REQ-132-003: PASS. Existing Meta Pixel/CAPI calls and historical data are unchanged.

## Scenario Reconciliation

- SCN-132-001: PASS for authenticated successful persistence.
- SCN-132-002: FAIL. Guest capture and retry/deduplication semantics are absent.
- SCN-132-003: PASS. Cart mutation logic and Meta behavior remain unchanged, and no historical rewrite occurs.

## Invariant Reconciliation

- INV-132-001: FAIL. The event cannot consistently represent all storefront add-to-cart behavior while guests are omitted without a defined denominator.
- INV-132-002: PASS for pre-persistence failures; PARTIAL for provider failures after persistence because capture is unguarded.
- INV-132-003: PASS. No historical or Meta mutation is present.

## Flow and Architecture Review

- FLOW-132-001: FAIL for guests and retry identity. Authenticated persistence does emit `cart_added` after the database/cache operation.
- FLOW-132-002: PARTIAL. Repository producers were inventoried, but dashboard consumers and the fixed-window comparison remain unverified.
- DEP-132-001: PARTIAL. The route is a confirmed-state source but not an idempotent event source.
- DEP-132-002: PARTIAL. Meta behavior is preserved; external PostHog consumers remain unaudited.

## Security and Integration Review

- SEC-132-001: PASS. The change does not broaden personal data exposure.
- INT-132-001: FAIL. No `$insert_id` or equivalent deduplication identity is provided, and `posthog.capture` is not isolated from the mutation response.
- INT-132-002: PASS. Meta event ID, Pixel, and CAPI behavior remain in the client hook.

## Scope and Drift Review

`MATERIAL_DRIFT`. The implementation narrows the PostHog population to authenticated server-cart users without resolving the contract’s guest denominator, retry, and provider-failure semantics. Task status must return to `IN_REVIEW`.

## Test Expectation Review

- TEXP-132-001: FAIL. The source-text assertion does not verify success/failure ordering, retries, or idempotency.
- TEXP-132-002: PARTIAL. Meta calls remain statically present, but guest/auth behavior is not covered.
- TEXP-132-003: PARTIAL. Production dashboard inventory and fixed-window comparison remain manual.

## Findings

### REV-132-001

- Severity: LOW
- Category: test
- Description: Production dashboard inventory and the fixed-window comparison remain manual UAT work.
- Evidence: TEXP-132-003 and absence of external dashboard evidence.
- Impact: Existing reports may continue to use a stale or mixed event definition.
- Recommendation: Audit PostHog consumers and record the comparison without rewriting history.

### REV-132-002

- Severity: BLOCKER
- Category: requirement
- Description: Removing client PostHog capture eliminates guest add-to-cart reporting because canonical `cart_added` is emitted only by a protected route.
- Evidence: REQ-132-001, REQ-132-002, SCN-132-002, BR-132-001; `useAddToCartTracking`; `cartRouter.addProductToCart` as `protectedProcedure`; guest-cart hook consumers.
- Impact: The canonical add-to-cart rate has an undocumented authenticated-only denominator and loses guest funnel activity.
- Recommendation: Define the approved guest denominator and implement a server-confirmed or explicitly scoped guest event path consistent with that definition.

### REV-132-003

- Severity: HIGH
- Category: integration
- Description: Canonical `cart_added` has no stable deduplication identity or failure-isolation boundary.
- Evidence: REQ-132-002, SCN-132-002, INT-132-001; both direct `posthog.capture` calls in `cartRouter.addProductToCart` lack `$insert_id` and error containment.
- Impact: Retried successful requests can inflate canonical counts, and an SDK exception can report mutation failure after cart persistence.
- Recommendation: Add an idempotency policy and isolate analytics delivery from cart mutation success.

## Decisions Requiring Attention

The existing approval selects server-confirmed `cart_added` as canonical but does not authorize silently excluding guests. Confirm the reporting denominator if the corrected design cannot provide a server-confirmed guest event.

## Final Recommendation

Do not merge REN-132 in its current form. Resolve guest reporting semantics, add idempotency/failure isolation, audit dashboards, and rerun governance review.
