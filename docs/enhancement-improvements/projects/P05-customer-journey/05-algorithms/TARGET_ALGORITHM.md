# Target Algorithm — Customer State Transitions (P05)

See the target Mermaid diagram in `04-architecture/STATE_MACHINE.md` ("Target state machine"). Prose description:

## Guest entry-point logic (target)
One rule, applied identically at every purchase-journey entry point: an unauthenticated visitor sees a consistent, functional guest experience up to the point payment is required (post-REN-95-decisions, that point moves to actual payment; pre-decisions, interim state per BRule-5 should at minimum make `/checkout` behave like `/mycart` rather than hard-redirecting on page load).

## Payment-capture-to-order transition logic (target)
1. Capture payment.
2. Write a durable reconciliation record keyed by `razorpay_payment_id`, before attempting any order creation.
3. Attempt order creation for the full set of line items (all brands, all items) inside a single `db.transaction()` — succeed completely or roll back completely.
4. On transaction failure: automated retry (bounded attempts), then — if still failing — flip the reconciliation record to an operator-visible "needs manual repair" state. Never silently present partial success as "Order Placed Successfully" to the customer.
5. On transaction success: close the reconciliation record, proceed to notifications and cart clearing exactly as today.
6. The relationship to Razorpay's webhook path is resolved explicitly (FR-1.5) so the reconciliation record has exactly one authoritative writer per payment.

## Cancellation transition logic (target)
- Redirect target is a function of the originating context, tracked through the same mechanism `checkout-content.tsx` already uses for Buy-Now/Swap-Reward query params (`buy_now`, `swap_reward`) — no new tracking mechanism is needed, only threading the existing context into the `ondismiss` handler.

## Cart-to-checkout availability transition (target)
- The same availability predicate runs at cart-render time (not only checkout-render time), sourced from one shared function (FR-4) so cart and checkout can never disagree about what's purchasable.
