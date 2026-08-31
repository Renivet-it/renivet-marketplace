# Current State — P05 Customer Journey & UX

Status: CONFIRMED unless marked otherwise. See `01-research/EVIDENCE_INDEX.md` for file:line citations.

## Checkout surfaces (CONFIRMED — two independent implementations, as REN-152 states)

1. **`/checkout`** (`src/app/(protected)/checkout/page.tsx` + `checkout-content.tsx`) — a single-page "review and pay" flow used for standard cart checkout, Buy-Now, and Swap & Reward redemption. Server component hard-redirects unauthenticated visitors to `/auth/signin`; there is no guest path into this surface at all.
2. **`/mycart` step 2** (`src/app/(protected)/mycart/page.tsx` → `CheckoutStepper` → `CartFetcher` + `Component/payment-stepper/payment.tsx`) — a three-step stepper flow (cart → address → payment) reached from the cart page. `mycart/page.tsx` renders `<GuestCartPage />` for unauthenticated visitors instead of hard-redirecting — a materially different guest treatment than `/checkout`.

A third surface, `src/components/globals/modals/profile/checkout.tsx`, is a modal variant that independently re-implements the TRYNEW20 auto-coupon logic (see `01-research/RESEARCH_SUMMARY.md`) — duplication broader than the two-implementation framing used in the original Linear scoping.

## Order creation and payment capture (CONFIRMED — REN-144)

Razorpay payment capture happens client-side first (the Razorpay checkout modal completes and calls the `handler` callback in `src/lib/razorpay/payment.ts`). Only inside that post-capture handler does the app call `verifyPayment`, then loop over `orderDetailsByBrand` and call the `createOrder` tRPC mutation once per brand group. Server-side, `createOrder` (`src/lib/trpc/routes/general/orders.ts`, line 251) loops a second time — **per line item**, not per brand — calling `queries.orders.createOrder()` for each item with no `db.transaction()` anywhere in the mutation.

The client-side loop over brand groups explicitly swallows per-iteration failures (`catch` block logs and comments "Continue with the next order even if one fails") and only throws if **zero** orders succeeded. Partial success — some items/brands ordered, others not, all against one captured payment — is treated as a normal success path.

An `ordersIntent` row is created before payment and updated with a JSON `orderLog` after each successful order row, but this is a progress log, not a transactional guarantee — it records what happened, it does not roll back or retry what didn't.

## Guest checkout blockers (CONFIRMED — REN-95's three layers)

1. **Route redirect**: `checkout/page.tsx` — `if (!userId) redirect("/auth/signin?redirect_url=/checkout")`.
2. **tRPC procedure gating**: `orders.ts` — `createOrder: protectedProcedure`, requiring an authenticated `ctx.user`.
3. **Schema constraint**: `src/lib/db/schema/order.ts` — `orders.userId` is `.notNull().references(() => users.id)`; a guest order row is not structurally representable today.

## Cart availability (CONFIRMED — REN-153)

Availability filtering (published, approved verification status, not deleted, `isAvailable`, quantity > 0, active, variant checks) exists only inside `checkout-content.tsx`'s `availableItems` computation. `Component/product-cart-card.tsx`, the cart-line UI component, has no availability-related logic at all — no badge, no messaging. A customer only learns an item dropped out at checkout, as a silent total change.

## TRYNEW20 auto-coupon (CONFIRMED — REN-161)

All three checkout surfaces auto-apply `TRYNEW20` whenever cart value exceeds ₹3,000 (`AUTO_COUPON_MIN_CART_VALUE = 3000 * 100` paise), with no client-side new-customer gating and no disclosure copy near the coupon UI in any of the three surfaces. Whether server-side `coupons.validateCoupon` enforces new-customer eligibility was not traced in this pass — see `01-research/EVIDENCE_INDEX.md` (marked UNKNOWN).

## Cancellation redirect (CONFIRMED — REN-163)

`src/lib/razorpay/payment.ts`, the Razorpay modal's `ondismiss` handler, unconditionally sets `window.location.href = "/mycart"` regardless of whether the customer arrived via normal cart checkout, Buy-Now, or Swap & Reward redemption.

## Guest Journey QA findings (INFERRED — not re-derived from source in this pass)

REN-108 (guest wishlist missing header/footer), REN-109 (cart tab title reads "Profile | Renivet" — CONFIRMED independently: `mycart/page.tsx` metadata `title: { default: "Profile", ... }`), REN-110 (Radix Dialog missing `aria-describedby` on search modal), REN-111 (inconsistent guest-redirect behavior — CONFIRMED mechanism: `/checkout` hard-redirects, `/mycart` shows a guest view), REN-112 (homepage interstitial third-button copy) are carried forward from the prior pass as-is except where independently confirmed above.
