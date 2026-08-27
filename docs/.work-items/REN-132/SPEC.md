# REN-132 Specification

## Goal

Reconcile duplicate add-to-cart analytics by selecting one canonical business event, preventing optimistic client over-counting from being mixed with server-confirmed cart state.

## Evidence and scope

- `useAddToCartTracking.ts` emits client `add_to_cart` after the database tracking action and also sends Meta Pixel/CAPI events.
- `src/lib/trpc/routes/general/cart.ts` emits server `cart_added` after persisted cart behavior.
- The issue reports a 4.3x discrepancy and recommends server-confirmed `cart_added` as the source of truth.
- Scope is event taxonomy, reporting usage, and duplicate/retry handling. Cart persistence, inventory, checkout, Meta payloads, and historical data deletion are out of scope unless separately approved.

## Acceptance criteria

- One canonical add-to-cart event is documented for dashboards and reports.
- Client optimistic and server-confirmed events are either removed from conflicting reporting or clearly re-scoped with distinct names/uses.
- Repeated clicks, retries, guest flows, failures, and eventual consistency do not create ambiguous canonical counts.
- Existing cart state and Meta tracking behavior remain unchanged unless explicitly included in the approved design.
- Tests and a dashboard/query inventory demonstrate that reports no longer mix the two semantics.

## Approved decision

Use server-confirmed `cart_added` as the canonical event for PostHog dashboards and reports. Preserve client-side `add_to_cart` for Meta Pixel/CAPI and/or clearly re-scope it as add-to-cart intent; do not delete or rewrite historical events, and do not change Meta behavior without separate approval.
