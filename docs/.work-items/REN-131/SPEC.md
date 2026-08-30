# REN-131 Specification

## Goal

Add a server-side PostHog `purchase_completed` capture to the order-creation flow so successful persisted orders retain an analytics record when browser JavaScript does not complete.

## Evidence and scope

- The issue identifies client captures in checkout/payment pages and no server-side PostHog capture in the order route.
- `src/lib/posthog/client.tsx` provides the existing `posthog-node` client.
- `src/lib/trpc/routes/general/orders.ts` creates one persisted order per item/brand and handles reward orders and external side effects.
- The current storefront splits one checkout into one `createOrder` mutation per brand, which cannot support a checkout-level server event.
- Scope includes replacing that split caller contract with one checkout mutation containing every brand/item. The order route may continue creating separate persisted orders internally.
- It must not alter payment authorization, order amounts, inventory, shipping, email, Meta Pixel/CAPI behavior, or historical analytics data.

## Acceptance criteria

- A complete checkout is submitted as one server mutation and emits one server-side `purchase_completed` event only after all resulting orders persist.
- The event uses the checkout intent ID as its stable `$insert_id` and contains aggregate order IDs, user identity, amount, currency, and approved item metadata.
- No event is emitted for rejected, rolled-back, or failed order creation.
- Multi-brand/multi-item and zero-value reward orders follow an explicit documented policy without accidental duplicate counting.
- PostHog failure is observed and does not roll back or falsely fail a successful order.
- Browser PostHog purchase capture is absent, while Meta Pixel/CAPI purchase behavior remains unchanged.
- Tests exercise the actual multi-brand checkout request builder, ordering, failure isolation, idempotency strategy, retry behavior, and sensitive-data exclusion.

## Approved decision

Emit one server-side `purchase_completed` event per complete checkout, not one event per brand-split order. Both storefront checkout implementations must send one `createOrder` mutation containing all checkout items. Use the existing order-intent ID as the stable checkout identifier and PostHog `$insert_id`; reward checkout may use its stable redemption ID. Remove only browser PostHog purchase capture and preserve Meta Pixel/CAPI plus payment/order state.
