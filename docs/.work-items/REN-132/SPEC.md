# REN-132 Specification

## Goal

Reconcile duplicate add-to-cart analytics by selecting one canonical business event, preventing optimistic client over-counting from being mixed with server-confirmed cart state.

## Evidence and scope

- `useAddToCartTracking.ts` emits client `add_to_cart` after the database tracking action and also sends Meta Pixel/CAPI events.
- `src/lib/trpc/routes/general/cart.ts` emits server `cart_added` after persisted cart behavior.
- The issue reports a 4.3x discrepancy and recommends server-confirmed `cart_added` as the source of truth.
- Scope is event taxonomy, reporting usage, duplicate/retry handling, and failure isolation. Cart persistence, inventory, checkout, Meta payloads, and historical data deletion remain unchanged.

## Acceptance criteria

- One canonical add-to-cart event is documented for dashboards and reports.
- Authenticated server-confirmed `cart_added` is canonical for persisted-cart reporting. Client/guest activity is emitted separately as `add_to_cart_intent` and must never be mixed into the canonical metric.
- Canonical capture failures cannot fail a successful cart mutation. A stable analytics event identity is accepted at the cart mutation boundary and used as PostHog `$insert_id` so transport retries cannot duplicate the canonical event.
- Existing cart state and Meta tracking behavior remain unchanged unless explicitly included in the approved design.
- Tests and a dashboard/query inventory demonstrate that reports no longer mix the two semantics.

## Approved decision

Use authenticated, server-confirmed `cart_added` as the canonical persisted-cart event for PostHog dashboards and reports. Rename the client PostHog event to `add_to_cart_intent` for guest/client funnel analysis and never combine it with canonical counts. Preserve Meta Pixel/CAPI exactly, add canonical-event deduplication and failure isolation, and do not delete or rewrite historical events.
