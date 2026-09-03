# Business Rules — P05 Customer Journey & UX

## BRule-1: Payment before order (current, unchanged by this Epic)
Razorpay payment capture happens before order rows exist in Renivet's database. This Epic does not propose reversing this sequence (capturing payment after order creation has its own tradeoffs and is out of scope for this documentation pass) — it proposes making the capture→order-creation step atomic and reconcilable. **DECISION REQUIRED**: whether to keep capture-then-order or move to order-then-capture is itself a product/architecture decision not resolved by this pass; the current V1 scope (see `10-roadmap/V1.md`) assumes capture-then-order remains and hardens it.

## BRule-2: One cart, many orders
A single checkout can produce multiple order rows — CONFIRMED to be split per line item (not per brand as originally documented) by `orders.ts`'s `createOrder` loop. This multi-order-per-checkout structure is a marketplace requirement (each brand needs its own order for fulfillment/payout) but the per-*item* (rather than per-brand) granularity found in this pass was not clearly an intentional business rule — flagged as DECISION REQUIRED: should the unit of order creation be per-brand (as originally understood) or is per-item intentional (e.g., for independent per-item fulfillment/cancellation)?

## BRule-3: TRYNEW20 auto-apply threshold
Auto-applies at cart value > ₹3,000, currently with no customer-eligibility gate visible client-side. The intended business rule (any customer vs. genuinely new customers only) is DECISION REQUIRED — see FR-5.1.

## BRule-4: Availability is checkout-time truth
The authoritative definition of "purchasable" (published, approved, not deleted, available, in stock, active, valid variant) lives in `checkout-content.tsx`. This Epic's FR-3 proposes surfacing this same rule earlier (in the cart), not changing the rule itself.

## BRule-5: Guest vs. authenticated treatment
Currently inconsistent by page (REN-111): `/mycart` renders a guest view, `/checkout` hard-redirects. Until REN-95 resolves guest checkout, product must decide (DECISION REQUIRED) whether the interim state should make `/checkout` behave like `/mycart` (show a guest view that funnels to sign-in at the point of payment) rather than redirecting immediately on page load — this could recover some conversion even before REN-95's full three-layer fix ships.
