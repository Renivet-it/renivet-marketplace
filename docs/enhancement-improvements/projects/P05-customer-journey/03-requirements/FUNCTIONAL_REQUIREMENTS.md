# Functional Requirements — P05 Customer Journey & UX

## FR-1 — Atomic order creation (REN-144)
FR-1.1: Order creation for a single checkout attempt (all line items across all brands) must succeed or fail as a unit from the customer's perspective — either every paid-for line item becomes an order, or the customer is told and the payment is reconciled (refunded or retried), never left in a silently partial state.
FR-1.2: The current per-item loop with catch-and-continue in `src/lib/razorpay/payment.ts` and the unwrapped per-item loop in `orders.ts`'s `createOrder` must be replaced with a mechanism that treats a captured payment's full set of line items as one unit of work, using `db.transaction()` at minimum for the database-write portion.
FR-1.3: A captured Razorpay payment must be reconcilable back to its resulting order rows (or lack thereof) via a durable, queryable record — the existing `ordersIntent.orderLog` progress field is not sufficient on its own (see FR-1.5).
FR-1.4: A payment-captured-but-order-creation-failed state must be automatically detectable (e.g., a background reconciliation job or webhook-driven check), not dependent on customer-initiated support contact.
FR-1.5: The relationship between the Razorpay webhook handlers (`src/app/api/webhooks/razorpay/*`) and the client-driven order-creation path must be resolved — either the webhook becomes the single source of truth for order finalization, or an explicit, documented reconciliation contract exists between the two paths.

## FR-2 — Guest checkout (REN-95)
FR-2.1: `/checkout` must offer a path for unauthenticated visitors to complete purchase, contingent on resolution of the 6 blocking decisions in `07-decisions/DECISION_QUEUE.md`.
FR-2.2: The `createOrder` tRPC procedure's authorization model must support a guest-order path without weakening the existing `ctx.user.id === input.userId` check for authenticated orders.
FR-2.3: The `orders.userId` NOT NULL foreign-key constraint must be resolved (e.g., nullable with a separate guest-identity mechanism, or a synthetic guest-user record strategy) — the specific mechanism is a DECISION REQUIRED item, not prescribed here.
FR-2.4: Guest checkout must present the same availability, coupon, and tax logic as authenticated checkout (dependency on FR-4).

## FR-3 — Cart availability visibility (REN-153)
FR-3.1: The cart view (`Component/product-cart-card.tsx` and its parent `CartComponent`) must evaluate and display the same availability predicate currently computed only in `checkout-content.tsx` (published, approved verification, not deleted, `isAvailable`, quantity > 0, active, variant validity).
FR-3.2: An unavailable cart item must be visually marked distinctly (e.g., badge/message) and excluded from the cart's running total, matching what checkout will actually charge.

## FR-4 — Single checkout business-logic source (REN-152)
FR-4.1: Coupon auto-apply logic (TRYNEW20 and any future auto-coupon), availability filtering, and tax computation must be extracted to one shared implementation consumed by all checkout surfaces (`/checkout`, `/mycart` step 2, and the profile checkout modal).
FR-4.2: The customization-request handling difference between the two checkout implementations (carried forward as INFERRED from the prior pass) must be re-verified and resolved as part of consolidation.

## FR-5 — TRYNEW20 disclosure (REN-161)
FR-5.1: The coupon's actual eligibility rule (server-side, in `coupons.validateCoupon`) must be determined and documented — this is a prerequisite to writing correct disclosure copy, not just a copy change.
FR-5.2: If the rule is not genuinely new-customer-gated, either add real eligibility enforcement or add disclosure copy that accurately describes the rule as it exists (e.g., "auto-applied on carts over ₹3,000").

## FR-6 — Context-aware cancellation redirect (REN-163)
FR-6.1: The Razorpay `ondismiss` handler must redirect based on the originating checkout context (standard cart, Buy-Now item, Swap & Reward redemption) rather than unconditionally to `/mycart`.

## FR-7 — Guest Journey QA fixes (REN-108–112)
FR-7.1 (REN-108): Guest wishlist page must render the standard header/footer.
FR-7.2 (REN-109): `/mycart`'s page metadata must reflect its actual function, not "Profile".
FR-7.3 (REN-110): The search modal's Radix Dialog must include a `Description`/`aria-describedby` association.
FR-7.4 (REN-111): Guest-redirect behavior must be made consistent across all login-wall entry points (or explicitly documented as intentionally different, per surface, if product decides guests should see different treatments at `/checkout` vs. `/mycart`).
FR-7.5 (REN-112): The homepage welcome interstitial's third-button copy change must be confirmed as intentional or corrected.
