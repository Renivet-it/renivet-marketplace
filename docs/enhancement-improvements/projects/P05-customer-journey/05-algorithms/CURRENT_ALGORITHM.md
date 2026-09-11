# Current "Algorithm" — Customer State Transitions (P05)

Per program instruction, "algorithm" for this Epic means customer state transitions and failure/retry paths — not a ranking or ML algorithm. The full diagrams live in `04-architecture/STATE_MACHINE.md`; this file describes the current transition logic in prose.

## Guest entry-point logic (current)
- `/mycart`: `if (!userId) return <GuestCartPage />` — guest sees a dedicated view, no redirect.
- `/checkout`: `if (!userId) redirect("/auth/signin?redirect_url=/checkout")` — guest is immediately removed from the checkout flow entirely.
- Net effect: the transition rule for "guest reaches a purchase-journey page" is **not a single algorithm** — it is two independently coded, inconsistent rules (REN-111).

## Payment-capture-to-order transition logic (current)
1. Capture payment (Razorpay, client-side) — unconditional entry to the next step regardless of what happens after.
2. Verify signature — hard stop only on cryptographic failure.
3. For each brand group (loop, not transaction): attempt order creation; on failure, log and advance to the next brand group regardless of outcome (no rollback, no compensating action).
4. Within each brand group, for each line item (loop, not transaction): attempt to insert an order + order item; on mid-loop failure, no rollback of already-inserted items in that brand group.
5. Success criterion for the entire flow: `createdOrders.length > 0` — i.e., "at least one thing worked" is sufficient to tell the customer "Order Placed Successfully."
6. Retry logic (`retryCreateOrder`) exists only around a single order-creation call (3 attempts, exponential backoff) — it improves the odds of step 3/4 succeeding on transient errors but does not change the catch-and-continue behavior once retries are exhausted.

## Cancellation transition logic (current)
- Single fixed target: `window.location.href = "/mycart"`, regardless of which of the three checkout surfaces or purchase modes (standard cart, Buy-Now, Swap & Reward) initiated the payment sheet.

## Cart-to-checkout availability transition (current)
- No transition exists in the cart itself — availability is computed once, at the moment checkout content loads, and only then. The cart state as displayed to the customer never reflects this evaluation.
