# Current State — P06 Measurement & Experimentation

Verified against `src/` in this pass (2026-08-28/30), not restated blind from the prior audit.

## Shipped (Deployed to Prod)

| Issue | Description | Verification |
|---|---|---|
| REN-128 | PostHog identity linking on login | `src/components/globals/posthog/identify-bridge.tsx` calls `posthog.identify(user.id, {email, phone})` on sign-in and `posthog.reset()` on sign-out. CONFIRMED shipped. |
| REN-129 | Reassess 5-second delayed PostHog init | No delayed/setTimeout-gated PostHog init found in current client init paths searched (`src/components/providers/client.tsx`, `posthog` component tree). Treated as resolved/superseded per prior audit; not independently re-litigated here (out of scope to re-investigate a shipped, closed item in depth). |
| REN-130 | PostHog tracking on phone-first-sign-up.tsx | `src/components/auth/phone-first-sign-up.tsx` references `posthog`. CONFIRMED present. |

## Backlog — instrumentation correctness (this Epic's core scope)

| Issue | Description | Source-code status this pass |
|---|---|---|
| REN-131 | No server-side `purchase_completed` capture | CONFIRMED. Only two `posthog?.capture(POSTHOG_EVENTS.COMMERCE.PURCHASE_COMPLETED, ...)` call sites exist in the entire `src/` tree, both client-side, inside React Query `onSuccess` handlers: `src/app/(protected)/checkout/checkout-content.tsx:483` and `src/app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx:323`. No `posthog.capture` for a purchase event exists anywhere in the tRPC order-creation backend (`src/lib/trpc/routes/general/orders.ts`) or in `src/actions/process-order-after-payment.ts`. |
| REN-132 | `add_to_cart` vs `cart_added` discrepancy | CONFIRMED differing trigger surfaces (see `05-algorithms/DECISION_LOGIC.md`). `cart_added` fires server-side, unconditionally, on every successful cart mutation (both new-item and quantity-increment branches) in `src/lib/trpc/routes/general/cart.ts` and `wishlist.ts`. `add_to_cart` fires client-side, once per user action, gated on the `useAddToCartTracking` hook (`src/lib/hooks/useAddToCartTracking.ts`) actually being wired to the calling UI and on client JS/PostHog having loaded. The 4.3× magnitude itself is INFERRED to follow from this structural asymmetry, not independently recomputed here. |
| REN-133 | Consolidate duplicate `purchase_completed` instrumentation | CONFIRMED — same two call sites as REN-131, near-duplicated event-construction logic in both files. |
| REN-134 | Rename `src/lib/posthog/client.tsx` | CONFIRMED. The file imports `PostHog` from `posthog-node` and constructs a server-side client (`new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {host: ...})`). The name `client.tsx` is misleading — it is the server-side PostHog client, used by backend routes (e.g., `cart.ts`) via `import { posthog } from "@/lib/posthog/client"`. Naming/hygiene only, no functional defect. |

## Cross-cutting P0: REN-145 (Meta Purchase event)

CONFIRMED at the source-code level, both sub-defects, in both purchase-completion code paths (`checkout-content.tsx` and `order-payment-page.tsx`):

1. **Currency-unit defect** — `fbEvent("Purchase", {value: totalAmountPaise, ...})` and `trackPurchaseCapi(..., {value: totalAmountPaise, ...})` pass the raw paise integer directly as `CustomData.value` to both the client-side Meta Pixel and the server-side Meta CAPI event. The PostHog capture immediately above each of these calls correctly applies `convertPaiseToRupees()` — the rupee conversion exists in the codebase and is simply not applied to the Meta-bound value.
2. **Per-brand fan-out** — `buildOrderDetailsByBrand()` (present in both files) splits a multi-brand cart into one order-creation call per brand (`for (const orderDetails of orderDetailsByBrand) { await retryCreateOrder(orderDetails); }` for COD; one `retryCreateOrder` per Razorpay callback for card/UPI). Each `createOrder` mutation's `onSuccess` independently fires its own `fbEvent("Purchase", ...)` and `trackPurchaseCapi(...)`, each carrying that brand's subtotal (still in paise). A single multi-brand checkout therefore sends N Meta Purchase events, not one.

Per the governing evidence, the **historical/runtime magnitude** of impact on actual ad spend is **PROBABLE, not CONFIRMED** — one month of real Meta-vs-PostHog data did not cleanly fit a clean-multiplier theory during QC. The **source defect itself is CONFIRMED** by direct code inspection in this pass.

## Cross-cutting: REN-154, REN-162, REN-164, REN-166

- REN-154 (search click/result-count logging is a no-op stub) — owned by P01; cited here only because P06 cannot measure search quality until P01 ships real event emission (see `DEPENDENCY_GRAPH.md` P06→P01 edge). Not re-investigated under this Epic.
- REN-162 (extend product-click tracking to search/homepage) — real, scoped gap; not independently re-verified in this pass beyond the prior audit's finding.
- REN-164 ("[Verification] Confirm PostHog init-timing race actually loses pre-init capture calls") — Backlog, Medium, **verification-only**. No init-timing race was independently reproduced or confirmed in this pass; treated as UNCONFIRMED, consistent with its own title.
- REN-166 ("[Deferred] GA4 e-commerce event instrumentation") — CONFIRMED premise: no `gtag`/GA4/Google Analytics event-emission code exists anywhere in `src/` (grep for GA4 markers returned no application-side instrumentation). The growth-audit's `ga4_device_sessions.csv` independently shows `conversions_purchase` and `total_revenue` at zero for every row in the 5-month window, consistent with GA4 e-commerce events never being wired up (not with zero purchases). Explicitly gated on DECISION-P06-001, not an engineering readiness signal.

## What "current state" does not include

No fix has been implemented as part of this documentation pass. No Linear issue was created, updated, or verified live via the Linear MCP tools (out of scope, per the governing instructions — this pass is source-code verification only).
