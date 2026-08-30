# REN-131 and REN-132 purchase/cart analytics implementation plan

## Goal

Make server-confirmed commerce events the reliable PostHog reporting boundary:

- Emit exactly one `purchase_completed` event per completed checkout, even when
  the checkout creates one order per brand.
- Keep the event failure-isolated from order/payment state.
- Use `cart_added` after successful cart persistence as the canonical PostHog
  add-to-cart event.
- Preserve the existing client Meta Pixel and Conversions API behavior.
- Do not rewrite historical analytics data.

## Implementation steps

1. Add a small, unit-testable purchase-event helper that aggregates persisted
   orders and checkout items into an allowlisted PostHog payload, uses the
   checkout intent/order group as the stable event identity, and contains SDK
   failures.
2. Add the server-side `purchase_completed` capture to
   `src/lib/trpc/routes/general/orders.ts` immediately after all checkout order
   rows have been persisted. Remove the two browser-side PostHog purchase
   captures while retaining their Meta Pixel/CAPI calls.
3. Remove the browser PostHog `add_to_cart` capture from
   `src/lib/hooks/useAddToCartTracking.ts`. Keep the existing Meta Pixel/CAPI
   calls and retain the server `cart_added` captures in the cart route.
4. Add regression tests for split-checkout aggregation, stable identity,
   privacy allowlisting, failure isolation, and the client/server event
   boundary.
5. Run focused tests, `bun test`, and governance validation for REN-131 and
   REN-132. Run the required implementation reviews after the code is green.

## Verification scenarios

- A normal checkout emits one server event after persistence.
- A multi-brand checkout emits one event containing all order IDs and items.
- A zero-value/reward checkout remains representable without payment secrets.
- PostHog capture failure does not fail the mutation.
- Failed cart persistence cannot produce canonical `cart_added`.
- Meta Pixel/CAPI calls remain present after the PostHog boundary change.
