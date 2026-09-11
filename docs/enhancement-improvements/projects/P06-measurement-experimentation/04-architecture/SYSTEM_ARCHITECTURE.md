# System Architecture — P06

## Three parallel, loosely-coordinated tracking systems

Renivet's measurement layer is not one system but three independently-integrated ones, each triggered from largely the same UI event sites:

1. **PostHog** — client (`posthog-js`, via `usePostHog()`) and server (`posthog-node`, `src/lib/posthog/client.tsx`, misnamed per REN-134). Used for product analytics, funnels, identity resolution.
2. **Meta Pixel + Conversions API (CAPI)** — client (`fbEvent`, `src/lib/fbpixel`) and server (`sendCapiEvent`, `src/lib/fb-capi.ts`, calling `facebook-nodejs-business-sdk`). Used for ad-campaign attribution and optimization. CAPI events are logged to `capiLogs` regardless of outcome.
3. **GA4** — not integrated (REN-166). No `gtag` or GA4 SDK usage exists in `src/`.

There is no shared "emit a commerce event" abstraction — each of PostHog, Pixel, and CAPI is invoked separately, by hand, at each site (e.g., three separate calls in `useAddToCartTracking.ts`: PostHog capture, `fbEvent`, `trackAddToCartCapi`). This is the architectural root cause behind REN-133 (duplication) and part of why REN-145's fix must be applied in more than one place.

## Client vs. server split

| Concern | Client-side | Server-side |
|---|---|---|
| PostHog | `posthog-js` via `usePostHog()` — page views, identify, add_to_cart, purchase_completed | `posthog-node` (`src/lib/posthog/client.tsx`) — cart_added, wishlist events |
| Meta | `fbEvent` (`src/lib/fbpixel`) — Pixel, browser-side | `sendCapiEvent` (`src/lib/fb-capi.ts`) via server actions (`src/actions/analytics.ts`) — CAPI, backend-side, deduplicated against Pixel via shared `eventId` |
| GA4 | none | none |

## Where purchase-completion tracking actually lives

Both purchase-tracking sites are **client-side React Query `onSuccess` handlers** attached to the `orders.createOrder` tRPC mutation:
- `src/app/(protected)/checkout/checkout-content.tsx` (`onSuccess` around line 470-534)
- `src/app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx` (`onSuccess` around line 313-377)

Each `onSuccess` independently fires PostHog `purchase_completed`, Pixel `Purchase`, and CAPI `Purchase` — three systems, from one client-side callback, duplicated across two entry points into the checkout flow (standard checkout vs. cart payment stepper).

## Dependency on P05

Per `docs/enhancement-improvements/DEPENDENCY_GRAPH.md`, P06 depends on P05 (Customer Journey & UX) as its event source: the checkout/payment flow files this Epic investigates (`checkout-content.tsx`, `order-payment-page.tsx`) are P05-owned surfaces. REN-144 (P05's P0, payment/order integrity) shares a root path with REN-145 — both originate in the same checkout completion logic. Any REN-145 fix should be coordinated with P05, not made in isolation, since both Epics touch the same `onSuccess` handlers.
