# Data Requirements — P05 Customer Journey & UX

## New/changed data needed for REN-144
- A durable reconciliation record keyed by `razorpay_payment_id` (or reuse/extend `ordersIntent` with a status enum: `pending`, `partially_fulfilled`, `fulfilled`, `failed_needs_repair`) — must be written before order creation is attempted, and closed only on confirmed full success.
- If webhook-driven reconciliation is adopted (FR-1.5), the webhook handler needs read/write access to the same record, keyed consistently.

## New/changed data needed for REN-95
- A guest-identity representation compatible with the `orders.userId` NOT NULL FK — mechanism is DECISION REQUIRED (07-decisions). Candidate shapes: (a) nullable `userId` + new `guestEmail`/`guestSessionId` columns, (b) synthetic "guest" user rows created per checkout. Each has different data-quality and migration implications not resolved in this pass.

## New/changed data needed for REN-153
- No new data — the availability predicate already exists in `checkout-content.tsx`; FR-3 requires the cart view to *query and render* the same fields (`isPublished`, `verificationStatus`, `isDeleted`, `isAvailable`, `quantity`, `isActive`, variant fields) it likely already receives from `getCartForUser` but does not currently evaluate.

## New/changed data needed for REN-161
- None structurally — requires determining (not creating) the existing server-side eligibility data/logic in `coupons.validateCoupon`.

## New/changed data needed for REN-163
- No new persisted data — requires threading existing in-memory query-param context (`isBuyNow`, `isSwapReward`, `rewardRedemptionId`) into the `ondismiss` callback, which does not currently receive it.
