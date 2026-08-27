# REN-131 Specification

## Goal

Add a server-side PostHog `purchase_completed` capture to the order-creation flow so successful persisted orders retain an analytics record when browser JavaScript does not complete.

## Evidence and scope

- The issue identifies client captures in checkout/payment pages and no server-side PostHog capture in the order route.
- `src/lib/posthog/client.tsx` provides the existing `posthog-node` client.
- `src/lib/trpc/routes/general/orders.ts` creates one persisted order per item/brand and handles reward orders and external side effects.
- Scope is server-side analytics after the authoritative order persistence point. It must not alter payment authorization, order creation, inventory, shipping, email, or client event behavior.

## Acceptance criteria

- A successfully persisted customer order emits one server-side `purchase_completed` event with a stable order identifier, user identity, amount, currency, and approved item metadata.
- No event is emitted for rejected, rolled-back, or failed order creation.
- Multi-brand/multi-item and zero-value reward orders follow an explicit documented policy without accidental duplicate counting.
- PostHog failure is observed and does not roll back or falsely fail a successful order.
- Tests verify ordering, failure isolation, idempotency strategy, and sensitive-data exclusion.

