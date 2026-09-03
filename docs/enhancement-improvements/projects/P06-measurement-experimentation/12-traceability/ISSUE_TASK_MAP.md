# Issue to Task Map — P06

| Issue | Requirement(s) | Key files to touch (verified this pass) |
|---|---|---|
| REN-145 | FR-1, FR-2, BR-1, BR-2 | `src/app/(protected)/checkout/checkout-content.tsx` (fbEvent/trackPurchaseCapi calls ~497-533), `src/app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx` (~337-376), both `buildOrderDetailsByBrand()` implementations |
| REN-131 | FR-3 | `src/lib/trpc/routes/general/orders.ts` (or equivalent order-confirmation point), `src/lib/posthog/client.tsx` (server client, reuse) |
| REN-132 | FR-5 | No code change — documentation artifact referencing `src/config/posthog.ts`, `src/lib/trpc/routes/general/cart.ts`, `src/lib/hooks/useAddToCartTracking.ts` |
| REN-133 | FR-4 | Same two files as REN-145 — extract shared payload-construction function |
| REN-134 | FR-6 | `src/lib/posthog/client.tsx` and all its import sites (`cart.ts`, `wishlist.ts`, others found via import search) |
| REN-166 (V2, gated) | FR-7 | Net-new — no existing file; gated on DECISION-P06-001 |
| REN-164 (verification) | FR-8 | `src/components/providers/client.tsx`, PostHog init sequence — verification task, not a specific file change |

This is a task-scoping aid for whoever picks up each issue, not an implementation plan — no code changes were made as part of this documentation pass.
