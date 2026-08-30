# REVIEW: REN-132 — Reconcile add_to_cart vs cart_added (4.3x discrepancy)

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `NO_DRIFT`; governance re-entry is not required. Server-confirmed `cart_added` remains the canonical PostHog event, while client Meta Pixel/CAPI tracking remains intact. Base: `4943c40a46901692fb7f77c3bf1259530303798a`; head: `8a5c8a4aa89c33d20f16ac88e4e6285de94a1a9f`.

## Review Scope and Git Evidence

- Compared `origin/master` merge-base `4943c40a46901692fb7f77c3bf1259530303798a` to `HEAD` `8a5c8a4aa89c33d20f16ac88e4e6285de94a1a9f`.
- The worktree was clean at review time; no PR URL was available.
- `useAddToCartTracking.ts` no longer emits PostHog `add_to_cart`; `cart.ts` retains `POSTHOG_EVENTS.CART.ADDED` after successful persistence branches.

## Requirement Reconciliation

- REQ-132-001: PASS. The implementation establishes server-confirmed `cart_added` as the PostHog reporting event.
- REQ-132-002: PASS for the code boundary. Failed persistence exits before the existing server capture; client intent no longer inflates the canonical PostHog count.
- REQ-132-003: PASS. Meta Pixel/CAPI calls remain in `useAddToCartTracking.ts`, and no historical data or dashboard records are modified.

## Scenario Reconciliation

- SCN-132-001: PASS. Both server cart-add branches capture only after add/update persistence succeeds.
- SCN-132-002: PASS for client/server count semantics by source inspection; retries and eventual provider delivery remain operational considerations.
- SCN-132-003: PASS. Cart persistence code and Meta calls are unchanged; only the PostHog client reporting emission is removed.

## Invariant Reconciliation

- INV-132-001: PASS. PostHog has one canonical add-to-cart source in the changed code paths.
- INV-132-002: PASS. Server capture follows the awaited persistence/cache operations and is not reached on thrown persistence errors.
- INV-132-003: PASS. No historical event deletion/rewrite or Meta behavior change was introduced.

## Flow and Architecture Review

- FLOW-132-001: PASS. Cart intent still reaches Meta Pixel/CAPI; successful server persistence produces `cart_added`.
- FLOW-132-002: PARTIAL. Repository event producers were reconciled, but external PostHog dashboard inventory and fixed-window production comparison are outside the repository diff.

## Security and Integration Review

- SEC-132-001: PASS. Removing the client PostHog call does not broaden identity or personal-data collection.
- INT-132-001: PASS. The existing server PostHog capture remains in both successful cart persistence branches.
- INT-132-002: PASS. Existing Meta event IDs, Pixel calls, and CAPI calls remain in the client hook.
- DEP-132-001 and DEP-132-002: PASS for repository behavior; external dashboard validation remains outstanding.

## Scope and Drift Review

`NO_DRIFT`. The change follows the approved boundary: server `cart_added` is canonical for PostHog, client Meta behavior remains, and historical analytics are untouched.

## Test Expectation Review

- TEXP-132-001: PASS for static source-boundary evidence and retained post-persistence server capture; no route integration fixture exists.
- TEXP-132-002: PASS. The focused test asserts client PostHog removal, server event retention, and the unchanged external tracking boundary.
- TEXP-132-003: PARTIAL. A production fixed-window dashboard comparison cannot be performed from repository evidence.

## Findings

### REV-132-001

- Severity: LOW
- Category: test
- Description: Production dashboard inventory and the required fixed-window before/after comparison remain a manual UAT task.
- Evidence: TEXP-132-003; repository search covers producers, but no external PostHog dashboard data or report definitions are present in the diff.
- Impact: Operators could continue using a mixed or stale dashboard until the reporting consumer is explicitly switched to `cart_added`.
- Recommendation: Audit PostHog reports for both event names and record a fixed-window comparison without deleting or rewriting historical events.

## Decisions Requiring Attention

None.

## Final Recommendation

Accept the implementation with the low-severity dashboard/UAT follow-up above. No governance re-entry is required; use `cart_added` for new PostHog add-to-cart reporting and preserve historical event data.
