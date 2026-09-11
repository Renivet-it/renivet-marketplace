# Performance — P06

## Current pattern (preserve)
All analytics/CAPI calls observed are fire-and-forget: `.catch(err => console.error(...))` rather than `await`-blocking the checkout UI. This is correct and must be preserved by any fix — a purchase must complete for the customer regardless of PostHog/Meta/GA4 availability or latency (NFR-1).

## Impact of proposed fixes on performance
- REN-145's currency fix: negligible (a function call already imported and used elsewhere in the same handler).
- REN-145's fan-out fix: if implemented as "wait for all N `createOrder` calls to resolve before firing tracking" (per `TARGET_ALGORITHM.md`), this could marginally delay when the Purchase event fires relative to individual order confirmations — acceptable, since it does not delay the customer-visible order-success UI, only the background analytics call.
- REN-131's server-side capture: adds one `posthog-node` `.capture()` call to the backend order-confirmation path — same lightweight, non-blocking pattern already used in `cart.ts`. Negligible.
- REN-133's consolidation: pure refactor, no performance change.

## Volume
No indication in the evidence base that PostHog/Meta/GA4 call volume is a scaling concern at Renivet's current order volume (11 Meta-attributed purchases in the audited 5-month-adjacent window is a low-volume regime). Not a reliability risk at current scale.
