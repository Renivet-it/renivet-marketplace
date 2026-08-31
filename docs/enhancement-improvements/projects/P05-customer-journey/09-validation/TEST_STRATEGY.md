# Test Strategy — P05 Customer Journey & UX

## Context
REN-101 (zero automated test coverage on the payment/order path) means this Epic starts from no safety net. This strategy defines the minimum this Epic's own changes must add (NFR-6), not a plan to close REN-101's full gap.

## REN-144 — required tests before/with the fix
- Unit test: `createOrder` mutation, multi-item input, forced failure on one item mid-loop → assert no partial rows are committed (transaction rollback verified).
- Unit test: multi-brand input, forced failure on one brand → assert either full rollback (if V1 scope makes the whole checkout atomic) or a correctly-flagged partial state in the reconciliation record (if V1 scope keeps brand-level independence but fixes detection) — the exact assertion depends on which target design (`07-feasibility/ALTERNATIVES.md`) is adopted.
- Integration test: simulated Razorpay capture → order-creation failure → assert reconciliation record reflects `failed_needs_repair`, not silent success.
- Regression test: existing single-brand, single-item happy path still succeeds and clears cart/redirects as today.

## REN-95 — required tests once implemented
- Guest checkout end-to-end: cart → checkout → payment → order, with no authenticated session, asserting the order row satisfies whatever guest-identity mechanism is chosen.
- Regression: authenticated checkout's `ctx.user.id === input.userId` ownership check still rejects cross-user order attempts (NFR-3).

## REN-152 — required tests during consolidation
- Parity test: for a fixed cart/coupon/address input, all three (soon-to-be-one) checkout surfaces produce identical `orderDetailsByBrand`-equivalent output, before and after consolidation.

## REN-153 / REN-161 / REN-163 — required tests
- Component test: cart view renders an "unavailable" badge for a product matching the availability-exclusion predicate.
- Unit test: TRYNEW20 trigger logic, once FR-5.1 resolves the intended rule, asserting the corrected eligibility check.
- Unit test: `ondismiss` redirect target varies correctly by `isBuyNow`/`isSwapReward` context.

## Not in scope for this Epic to test
Delhivery fulfillment lifecycle (DEF-002/DEF-003), unauthenticated-endpoint findings (REN-93/94), and general payment-path coverage beyond what NFR-6 requires for this Epic's own changes.
