# Component Architecture — P06

## Core files (verified this pass)

| File | Role |
|---|---|
| `src/config/posthog.ts` | Central PostHog event-name registry (`POSTHOG_EVENTS`) — single source of truth for event strings, well-structured, not itself defective |
| `src/lib/posthog/client.tsx` | Server-side (`posthog-node`) PostHog client — misnamed per REN-134 |
| `src/components/globals/posthog/identify-bridge.tsx` | Client component: Clerk auth state → `posthog.identify()`/`posthog.reset()` (REN-128, shipped) |
| `src/components/globals/posthog/page-view.tsx` | Client component: route changes → `$pageview` capture |
| `src/lib/hooks/useAddToCartTracking.ts` | Client hook: fires PostHog `add_to_cart`, Pixel `AddToCart`, CAPI `AddToCart` (via `trackAddToCartCapi`) together, once per invocation |
| `src/lib/trpc/routes/general/cart.ts`, `wishlist.ts` | Server tRPC routes: fire PostHog `cart_added` (server client) unconditionally on cart mutation, plus a separate brand-analytics `BRAND_EVENTS.CART.ADDED` track call |
| `src/lib/fbpixel` | Client-side Meta Pixel wrapper (`fbEvent`) |
| `src/lib/fb-capi.ts` | Server-side Meta CAPI wrapper (`sendCapiEvent`) — constructs `UserData`/`CustomData`/`ServerEvent`, calls Meta's SDK, logs to `capiLogs` |
| `src/actions/analytics.ts` | Server actions (`"use server"`) wrapping `sendCapiEvent` per event type: `trackAddToCartCapi`, `trackInitiateCheckoutCapi`, `trackPurchaseCapi`, `trackViewContentCapi` — enriches user data from Clerk/DB before sending |
| `src/app/(protected)/checkout/checkout-content.tsx` | Primary checkout flow — `createOrder` mutation `onSuccess` fires all three purchase-completion systems; contains `buildOrderDetailsByBrand()` (per-brand fan-out) |
| `src/app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx` | Alternate/cart-page checkout flow — near-duplicate of the above, its own `buildOrderDetailsByBrand()` |
| `src/lib/db/schema/capi-logs.ts` | `capiLogs` table — audit trail of every CAPI call, success or failure |

## Coupling risk

`buildOrderDetailsByBrand()` exists as two independent, near-identical implementations (one per checkout entry point) rather than a shared utility. Any REN-145 fix touches both. This mirrors the REN-133 duplication pattern one layer down — the codebase's checkout logic itself is duplicated across two files, not just the analytics calls layered on top of it.

## No shared "commerce event" module

There is no `emitCommerceEvent(name, payload)`-style abstraction that fans out to PostHog + Pixel + CAPI (+ future GA4) consistently. Each call site hand-writes three (soon potentially four) separate calls. This is flagged as a real architectural gap in `11-critique/ARCHITECTURE_CRITIQUE.md`, but building that abstraction is explicitly NOT recommended as a V1 scope item — see `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md`.
