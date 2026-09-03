# Acceptance Criteria — P05 Customer Journey & UX

## REN-144 — Payment/order integrity
- AC1: Given a multi-brand, multi-item cart, when payment is captured and order creation is triggered, then either all line items become orders or none do — no partial state is observable to the customer or in the database.
- AC2: Given an order-creation failure after payment capture, when the failure occurs, then an automated mechanism detects it within a bounded time window and creates an actionable record (not solely a customer-initiated support ticket).
- AC3: Given a captured Razorpay payment ID, when an operator looks it up, then they can determine definitively whether matching orders exist, without manual database inspection beyond a single documented lookup.
- AC4: Regression: existing single-brand, single-item checkout continues to succeed with no added customer-facing latency beyond NFR-4's bound.

## REN-95 — Guest checkout
- AC1: Given an unauthenticated visitor with items in cart, when they reach checkout, then they can complete purchase without creating an account (post-decision-resolution).
- AC2: Given a guest completes checkout, when the order is created, then it satisfies whatever guest-identity mechanism is decided (FR-2.3) without violating the authenticated-order authorization check (NFR-3).
- AC3: All 6 items in `07-decisions/DECISION_QUEUE.md`'s REN-95 entry are resolved and documented before implementation begins.

## REN-152 — Duplicated checkout logic
- AC1: Given a change to coupon, availability, or tax logic, when it is made once in the shared implementation, then it is reflected identically across `/checkout`, `/mycart` step 2, and the profile checkout modal.
- AC2: The customization-request handling discrepancy between implementations (if confirmed on re-verification) is resolved to one consistent behavior.

## REN-153 — Cart availability
- AC1: Given a cart item that would be excluded at checkout, when the customer views the cart, then that item is visibly marked unavailable before reaching checkout.
- AC2: The cart's displayed total excludes unavailable items, matching what checkout will actually charge.

## REN-161 — TRYNEW20 disclosure
- AC1: Given the server-side eligibility rule is determined, when a customer sees TRYNEW20 auto-applied, then adjacent copy accurately describes why (threshold-based, or genuinely new-customer-gated, whichever is decided).

## REN-163 — Cancellation redirect
- AC1: Given a customer cancels payment from Buy-Now, when they dismiss the Razorpay modal, then they return to the product page they were buying, not `/mycart`.
- AC2: Given a customer cancels payment from a Swap & Reward redemption, when they dismiss the modal, then they return to the redemption flow.
- AC3: Given a customer cancels payment from standard cart checkout, when they dismiss the modal, then they return to `/mycart` (unchanged, correct default for this case).

## REN-108–112 — Guest Journey QA findings
- AC1 (REN-108): Guest wishlist page renders header and footer identically to other guest-accessible pages.
- AC2 (REN-109): `/mycart` browser tab title reflects cart/checkout context, not "Profile".
- AC3 (REN-110): Search modal passes an accessibility audit for dialog description association.
- AC4 (REN-111): Guest-redirect behavior is documented as either unified or intentionally differentiated per page, with product sign-off either way.
- AC5 (REN-112): Homepage interstitial third-button copy behavior is confirmed intentional (and documented) or fixed to be consistent.
