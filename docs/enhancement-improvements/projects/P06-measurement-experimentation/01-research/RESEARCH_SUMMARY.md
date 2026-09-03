# Research Summary — P06

Source-code investigation performed for this documentation pass against the live `src/` tree of `renivet-marketplace`. All file paths and line numbers below were read directly; none are restated blind from the prior portfolio-governance pass.

## 1. PostHog client naming (REN-134)

`src/lib/posthog/client.tsx` (6 lines):
```
import { PostHog } from "posthog-node";
export const posthog = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, { host: env.NEXT_PUBLIC_POSTHOG_HOST });
```
This is the **server-side** PostHog Node client, imported by backend tRPC routes (e.g., `src/lib/trpc/routes/general/cart.ts`, `wishlist.ts`). **CONFIRMED**: the filename `client.tsx` is misleading in a codebase that also has genuine browser-side PostHog usage (`posthog-js/react`'s `usePostHog()`, used in `identify-bridge.tsx`, `page-view.tsx`, `useAddToCartTracking.ts`). REN-134's naming concern is accurate. Classification: **CONFIRMED**, Low severity, hygiene only.

## 2. `add_to_cart` vs `cart_added` (REN-132)

Two distinct, independently-fired events defined in `src/config/posthog.ts`:
- `CART.ADDED = "cart_added"` — fired **server-side** in `src/lib/trpc/routes/general/cart.ts` (both the new-cart-item branch and the existing-item quantity-increment branch call `posthog.capture({event: POSTHOG_EVENTS.CART.ADDED, ...})`, using the server-side `posthog-node` client) and again in `wishlist.ts` (wishlist→cart flows).
- `COMMERCE.ADD_TO_CART = "add_to_cart"` — fired **client-side**, once, inside `src/lib/hooks/useAddToCartTracking.ts`, gated on the hook being called from UI and on `usePostHog()` returning a loaded client.

**CONFIRMED**: these are structurally different events with different trigger surfaces — `cart_added` is a backend-mutation event (fires on every successful DB write, including quantity increments to an already-cart'd item), `add_to_cart` is a frontend-intent event (fires once per user click, dependent on client JS surviving). This asymmetry is a plausible mechanism for a large raw-count discrepancy between the two. The specific 4.3× multiplier from the prior audit is **INFERRED** to be consistent with this asymmetry, not independently recomputed in this pass (would require live PostHog query access, out of scope for a documentation-only pass).

## 3. Duplicate `purchase_completed` (REN-131 / REN-133)

Exactly two call sites for `POSTHOG_EVENTS.COMMERCE.PURCHASE_COMPLETED` exist in `src/`, both client-side, both inside a shared tRPC mutation's `onSuccess` handler pattern:
- `src/app/(protected)/checkout/checkout-content.tsx:483`
- `src/app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx:323`

Both compute near-identical payloads (`order_ids`/`order_id`, `product_ids`, `brand_ids`, `total_amount` via `convertPaiseToRupees`, `currency: "INR"`, `total_items`, `payment_method`) independently — **CONFIRMED duplication**, consistent with REN-133. No `posthog.capture` for a purchase-type event exists anywhere in the order-creation backend (`src/lib/trpc/routes/general/orders.ts`) — **CONFIRMED**: REN-131's "no server-side capture" claim holds. This means purchase completion is measured *only* if the customer's browser tab stays open and JS executes through to the `onSuccess` callback after payment — a payment can succeed at the backend/Razorpay/COD level with zero PostHog signal if the client is closed, backgrounded (mobile), or throws before that point.

## 4. Meta CAPI/Pixel Purchase event defect (REN-145)

Traced the full path: `checkout-content.tsx` / `order-payment-page.tsx` → `fbEvent()` (`src/lib/fbpixel`, client Pixel) and `trackPurchaseCapi()` (`src/actions/analytics.ts`, server action) → `sendCapiEvent()` (`src/lib/fb-capi.ts`) → Meta's `facebook-nodejs-business-sdk` `CustomData.setValue()`.

- **Currency-unit defect — CONFIRMED.** In both files, the `fbEvent("Purchase", {value: totalAmountPaise, ...})` and `trackPurchaseCapi(..., {value: totalAmountPaise, ...})` calls pass the raw paise integer. The adjacent PostHog capture in the same `onSuccess` block calls `convertPaiseToRupees(totalAmountPaise)` — proving the conversion utility exists and is available, but is simply not applied to the two Meta-bound calls. `sendCapiEvent` passes this value straight through to `custom.setValue(customData.value)` with no unit conversion at any layer. There is no unit-conversion logic anywhere between the checkout `onSuccess` handler and the outbound Meta API call.
- **Per-brand fan-out — CONFIRMED.** `buildOrderDetailsByBrand()` (defined identically in both files) groups cart items by `brandId` and returns one order-detail object per brand, each carrying that brand's own subtotal (`brandTotal`), not the cart's grand total. The COD path explicitly loops: `for (const orderDetails of orderDetailsByBrand) { await retryCreateOrder(orderDetails); }`. The Razorpay path invokes `retryCreateOrder` once per brand via the payment options' `createOrder` callback. Each `retryCreateOrder` call independently triggers the `createOrder` mutation's `onSuccess`, which independently fires its own `fbEvent("Purchase", ...)` and `trackPurchaseCapi(...)`. **A multi-brand checkout therefore sends one Meta Purchase event per brand, each carrying that brand's paise-denominated subtotal as its (uncoverted) value** — compounding both defects: N events instead of 1, and each ~100× inflated relative to its own subtotal.
- Per the governing evidence, do not present this as "100× overstatement, confirmed, for the full historical period." The **source defect is CONFIRMED**; the **historical/runtime magnitude of impact on actual ad spend is PROBABLE, not CONFIRMED** (one real month of data did not cleanly fit the expected clean-multiplier theory during QC).

## 5. GA4 (REN-166)

No `gtag`, GA4 measurement ID, or Google Analytics event-emission code was found anywhere in `src/` in this pass. **CONFIRMS** REN-166's premise. The 2026-08-23 growth audit's `ga4_device_sessions.csv` independently shows `conversions_purchase` and `total_revenue` at zero for every row across the 5-month window — consistent with GA4 e-commerce events never being wired up, not with zero purchases actually occurring. Classification: **CONFIRMED gap, explicitly DEFERRED**, gated on `DECISION-P06-001` in `docs/enhancement-improvements/07-decisions/DECISION_QUEUE.md` ("Is GA4 needed as a second revenue-reporting source at all, or is PostHog+Meta sufficient?").

## 6. REN-164 (PostHog init-timing race) — verification-only, not re-litigated

No delayed/gated PostHog initialization (e.g., `setTimeout` around `posthog.init`) was found in the current client provider tree searched (`src/components/providers/client.tsx` and the PostHog component tree). This is consistent with REN-129 having already been shipped/resolved, but this pass did not attempt to reproduce a pre-init capture-loss race, which is exactly what REN-164 exists to verify. Left as **UNCONFIRMED / verification-only**, per its own title.

## What was not investigated (explicitly out of scope for this pass)

- Live PostHog/Meta/GA4 query access (no MCP session established; this pass is static source-code verification only).
- REN-154/162 (owned by P01) — cited, not re-derived.
- Reproducing the REN-164 race condition at runtime.
