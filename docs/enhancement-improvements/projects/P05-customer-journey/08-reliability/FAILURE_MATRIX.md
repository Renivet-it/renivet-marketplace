# Failure Matrix — P05 Customer Journey & UX

REN-144 is the central case in this Epic and the single most severe scenario in the whole portfolio. Each scenario below is classified against the CONFIRMED current behavior in `04-architecture/STATE_MACHINE.md`.

## 1. Payment captured, order creation fails partway (REN-144 — CENTRAL CASE)
- **Trigger**: any transient error (DB blip, stale product/brand lookup, network issue) during the per-brand or per-item order-creation loop, after Razorpay has already captured funds.
- **Expected behavior**: customer is charged exactly for what becomes an order; any shortfall is either prevented (all-or-nothing) or transparently resolved (refund or completed retry) without silent gaps.
- **Current system behavior (CONFIRMED)**: catch-and-continue at the brand level, no transaction at the item level; `createdOrders.length > 0` is treated as full success; customer sees "Order Placed Successfully" regardless of completeness.
- **Customer impact**: charged for items they never receive an order for; discovers this only by manually reconciling their bank/UPI statement against their order history.
- **Recovery (current)**: none automated. Customer must contact support; support has no dedicated tooling beyond `ordersIntent.orderLog` (a progress marker, not a diagnostic report) and raw database inspection.
- **Audit trail (current)**: partial — `ordersIntent.orderLog` records the last completed step per intent, but is overwritten per update (see `06-data/DATA_QUALITY.md`), so it cannot show a full history of what succeeded vs. failed within one checkout.
- **Monitoring (current)**: none evidenced — no alerting on `createdOrders.length < brandCount` was found in the code read in this pass.

## 2. Duplicate Razorpay webhook delivery
- **Trigger**: Razorpay redelivers a `payment.captured` webhook (standard behavior for any webhook provider under retry-on-timeout semantics).
- **Expected behavior**: idempotent handling — a redelivered webhook for an already-reconciled payment is a no-op.
- **Current system behavior**: UNKNOWN — webhook handler internals (`src/app/api/webhooks/razorpay/payments/route.ts`) were not opened in this pass. Given the client-driven path is the confirmed primary order-creation trigger, whether the webhook path independently attempts order creation (and thus whether duplicate delivery could double-create orders) is an open question, not just a duplicate-delivery-tolerance question.
- **Customer impact**: potentially duplicate orders/charges if the webhook independently creates orders — UNKNOWN, flagged for investigation.
- **Recovery / Audit trail / Monitoring**: UNKNOWN.

## 3. Concurrent cart modification (two tabs, or cart changes between load and checkout)
- **Trigger**: customer adds/removes items in one tab while checkout is open in another, or a product goes out of stock between cart load and the checkout page's `availableItems` computation.
- **Expected behavior**: checkout reflects the true, current cart state; no stale-item charge.
- **Current system behavior**: `availableItems` is recomputed at checkout-content render/refetch time from `getCartForUser`, which mitigates staleness at the availability level, but there is no explicit optimistic-concurrency check (e.g., a cart version token) preventing a race between the customer's final review and the moment `createOrder` executes server-side.
- **Customer impact**: LOW-MEDIUM — server-side `orders.ts` re-fetches product state (`queries.products.getProduct` with the same availability filters) at order-creation time, which is a real server-side re-validation (CONFIRMED, lines ~491-511) — this mitigates most of the risk, though it does not fully close the gap between price shown and price charged if a price changes mid-flow (not verified).
- **Recovery**: server-side re-validation naturally rejects unavailable items at order-creation time; whether this surfaces a clear customer-facing message or silently drops the item (mirroring REN-153's broader problem) was not verified — INFERRED risk.

## 4. Browser refresh / tab close mid-checkout (after capture, before order creation completes)
- **Trigger**: customer's browser crashes, tab closes, or they navigate away between Razorpay capture and the `handler` callback completing its order-creation loop.
- **Expected behavior**: order creation completes independent of the client's continued presence (e.g., via webhook or server-side job), or is reliably retried.
- **Current system behavior (CONFIRMED architecturally)**: the entire order-creation sequence (steps 6-12 in `04-architecture/DATA_FLOW.md`) runs client-side inside the `handler` callback. If the browser is gone before this completes, order creation simply does not happen — there is no server-side fallback trigger evidenced other than the webhook path, whose role is UNKNOWN.
- **Customer impact**: HIGH — payment captured, zero orders created, and the client-side `ordersIntent` update may never fire either, depending on exactly when the interruption occurs.
- **Recovery**: none automated, unless the (unverified) webhook path independently creates orders.
- **Monitoring**: none evidenced.

## 5. Network loss during payment (before capture confirms to the client)
- **Trigger**: customer's network drops between initiating payment and Razorpay's client SDK confirming capture.
- **Expected behavior**: customer is not double-charged on retry, and is not left in ambiguity about whether payment succeeded.
- **Current system behavior**: Razorpay's own SDK/checkout modal handles this ambiguity on the payment-provider side (standard behavior); Renivet's app-side risk is the same as scenario 4 once/if capture did succeed but the confirmation never reaches the client.
- **Recovery**: depends entirely on Razorpay-side idempotency and Renivet's (unverified) webhook reconciliation.

## 6. Cancellation after capture (customer dismisses modal, but payment had already captured)
- **Trigger**: a race where Razorpay capture completes but the `ondismiss` handler fires (e.g., modal UI timing edge case) instead of, or in addition to, `handler`.
- **Expected behavior**: the app never tells the customer "cancelled" if money was actually taken.
- **Current system behavior**: `ondismiss` (CONFIRMED) unconditionally shows "Payment Cancelled" and redirects to `/mycart` — it does not check whether a capture in fact occurred. Whether Razorpay's SDK guarantees `handler` and `ondismiss` are mutually exclusive was not verified in this pass (UNKNOWN, Razorpay-SDK-contract question, not app-code).
- **Customer impact**: potentially told "cancelled" while actually charged, compounding scenario 1's risk with a misleading UI message.
- **Recovery**: none evidenced beyond whatever the (unverified) webhook path provides.

## Related untracked risks (referenced, not owned by this Epic)
- **DEF-002** (Delhivery shipment stuck "Active" after cancellation) and **DEF-003** (inventory double-decrement on cancellation) are downstream, post-order-creation lifecycle defects from `08-risks/PORTFOLIO_RISK_REGISTER.md`. They compound the impact of scenario 1 (a customer support team already dealing with a partial-order ticket may also encounter a shipment/inventory inconsistency on the same order) but their root cause was not investigated in this pass.
