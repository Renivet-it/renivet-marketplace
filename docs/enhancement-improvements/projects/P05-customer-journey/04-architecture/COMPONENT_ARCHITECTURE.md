# Component Architecture — P05 Customer Journey & UX

## Checkout surface 1: `/checkout`
- `src/app/(protected)/checkout/page.tsx` — server component, auth gate (hard redirect), renders `CheckoutContent`.
- `src/app/(protected)/checkout/checkout-content.tsx` — client component (~1600 lines), owns: cart/reward item assembly, price/coupon/tax computation, order-intent creation, Razorpay initialization, COD order placement, reward redemption placement.
- `src/lib/razorpay/payment.ts` — shared by this surface (and, per REN-152, should be shared by all): builds Razorpay options, owns the post-capture `handler` and `ondismiss` callbacks.

## Checkout surface 2: `/mycart` step 2
- `src/app/(protected)/mycart/page.tsx` — server component; branches to `GuestCartPage` for unauthenticated visitors (no hard redirect, unlike surface 1), otherwise renders a 3-step `CheckoutStepper` (cart → address → payment).
- `Component/payment-stepper/payment.tsx`, `Component/payment-stepper/cart-data-fetcher.tsx` — step-2 payment UI, independently re-implementing order assembly and Razorpay initialization.
- `Component/checkout-section.tsx` — step-0 order summary sidebar; independently re-implements the TRYNEW20 auto-apply effect.

## Checkout surface 3: profile checkout modal
- `src/components/globals/modals/profile/checkout.tsx` — a modal variant (likely invoked from a profile/quick-buy context); independently re-implements the TRYNEW20 auto-apply effect a third time.

## Cart view (REN-153 gap)
- `Component/cart-component.tsx` — cart list container.
- `Component/product-cart-card.tsx` — individual cart line item; confirmed to carry no availability logic.

## Order creation (server)
- `src/lib/trpc/routes/general/orders.ts` — `createOrder` mutation; per-item loop, no transaction (REN-144).
- `src/lib/trpc/routes/general/orders-intent.ts` — `orderIntent.createIntent` / `linkOrderIntentToOrder`; pre-payment intent tracking, the closest existing thing to a reconciliation aid.
- `src/lib/db/schema/order.ts` — `orders` table schema, including the NOT NULL `userId` FK relevant to REN-95.

## Payment webhooks (separate path, not traced in depth)
- `src/app/api/webhooks/razorpay/payments/route.ts`
- `src/app/api/webhooks/razorpay/refunds/route.ts`
- `src/app/api/webhooks/razorpay/subscriptions/route.ts`

## Consolidation implication (REN-152)
A shared module (e.g., `src/lib/checkout/engine.ts`, name illustrative) should own: availableItems filtering (FR-3/FR-4 shared with cart), price/coupon/tax calculation, `buildOrderDetailsByBrand`-equivalent assembly, and the create-order/retry orchestration — consumed by all three surfaces above instead of each re-implementing it.
