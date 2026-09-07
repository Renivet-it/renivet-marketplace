# REN-163 Engineering Specification

## Contract status

`BLOCKED` because this combined branch is not the exact Linear task branch `ayanganguly333/ren-163-return-the-originating-context-on-payment`; implementation remains gated until the task branch is explicitly aligned.

## Source context

Linear issue: [REN-163](https://linear.app/renivet/issue/REN-163/return-the-customer-to-their-originating-context-on-payment)

The issue reports that the shared Razorpay customer-payment helper hardcodes `window.location.href = "/mycart"` in `modal.ondismiss`. Both customer checkout callers already know whether the flow is normal cart, Buy Now, or swap-reward checkout. The intended change is limited to cancellation navigation; successful-payment handling, payment verification, order creation, stock mutation, and order reconciliation remain out of scope.

## Repository evidence

- `src/lib/razorpay/payment.ts` owns `createRazorpayPaymentOptions` and currently hardcodes `/mycart` after the cancellation modal state is shown for three seconds.
- `src/app/(protected)/checkout/checkout-content.tsx` derives `isBuyNow`, `buyNowItemId`, `buyNowVariantId`, `buyNowQty`, `isSwapReward`, and `rewardRedemptionId`, then calls `createRazorpayPaymentOptions`.
- `src/app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx` calls the same helper for the normal cart flow.
- `src/components/orders/order-page.tsx` calls the same helper for payment of an existing pending order; it does not carry checkout query context and must retain the `/mycart` fallback.
- The checkout route already supports `buy_now`, `item`, `variant`, `qty`, `swap_reward`, and `redemption` URL parameters.
- The issue has no Linear comments and no blocking/duplicate relations; it is related to REN-144 and REN-135 only for adjacent payment-flow ownership and merge coordination.
- The current branch is `ayanganguly333/ren-134-157-161-163`, while Linear expects `ayanganguly333/ren-163-return-the-originating-context-on-payment`.

## Risk assessment

- Initial risk: `L1` — contained customer-facing navigation change.
- Path-rule risk: `L2` — payment flow and Razorpay integration are explicitly risk-escalating domains.
- Semantic risk: `L2` — an incorrect destination can strand a customer in the wrong checkout context, though it does not alter payment authorization or order state.
- Final risk: `L2`.

## Design

Add an optional cancellation destination to the shared customer Razorpay options helper, defaulting to `/mycart` for callers that do not provide context. The checkout caller constructs a same-origin destination from its existing query state:

- Buy Now: `/checkout?buy_now=true&item=<item>&variant=<variant>&qty=<qty>`.
- Swap reward: `/checkout?swap_reward=true&redemption=<redemption>`.
- Normal cart: `/mycart`.
- Existing pending-order payment: `/mycart` via the helper default; this caller is explicitly unchanged.

The destination must be built with `URLSearchParams` (not string concatenation), and absent optional parameters must be omitted. If Buy Now or swap-reward context is incomplete, fall back to `/mycart` rather than producing an unusable checkout URL. The payment helper only assigns `window.location.href` after the existing cancellation UI delay. No `router.back()`, payment retry, mutation, query invalidation, or automatic retry is introduced.

## Requirements

- `REQ-163-001` (explicit): Preserve the existing payment-cancellation modal state and delay before navigation.
- `REQ-163-002` (explicit): Return Buy Now cancellation to the checkout route with the original Buy Now parameters.
- `REQ-163-003` (explicit): Return swap-reward cancellation to the checkout route with the redemption identifier.
- `REQ-163-004` (explicit): Preserve normal-cart cancellation to `/mycart`.
- `REQ-163-005` (inferred): Keep the destination same-origin and omit missing optional query parameters.
- `REQ-163-006` (explicit): Preserve `/mycart` fallback for the existing pending-order payment caller.
- `REQ-163-007` (inferred): If Buy Now or swap-reward context is incomplete, fall back to `/mycart`.
- `REQ-163-008` (inferred): Do not change payment success, payment failure, verification, order creation, inventory, cart deletion, or corporate Razorpay flows.

## Scenarios

- `SCN-163-001`: A customer cancels Buy Now payment and is sent to `/checkout` with `buy_now=true`, item, variant, and quantity values preserved.
- `SCN-163-002`: A customer cancels swap-reward payment and is sent to `/checkout` with `swap_reward=true` and the redemption value preserved.
- `SCN-163-003`: A customer cancels normal cart payment and is sent to `/mycart`.
- `SCN-163-004`: Buy Now or swap-reward optional values that are absent are omitted rather than serialized as `undefined`, and no external-origin URL can be supplied by caller state.
- `SCN-163-005`: Payment for an existing pending order retains the helper's `/mycart` fallback.
- `SCN-163-006`: Incomplete Buy Now or swap-reward context falls back to `/mycart` without opening an unusable checkout.
- `SCN-163-007`: Successful payment option behavior and non-customer corporate Razorpay initialization remain unchanged.

## Invariants

- `INV-163-001`: Cancellation navigation never changes payment authorization or order persistence state.
- `INV-163-002`: Every cancellation destination is a local application path with no attacker-controlled origin.
- `INV-163-003`: Normal-cart fallback remains exactly `/mycart`.
- `INV-163-004`: The cancellation callback does not invoke payment/order/cart mutations or automatic retries.
- `INV-163-005`: A later successful-payment callback is not suppressed or altered by cancellation-destination wiring.

## Flow

- `FLOW-163-001`: Caller derives a local cancellation path from known checkout context → shared helper receives the path → Razorpay dismiss callback shows existing cancellation UI → after the existing delay, browser navigates to that local path.

## Dependencies and boundaries

- `DEP-163-001`: Razorpay options callback contract; resolved, because the existing `ondismiss` callback remains valid.
- `DEP-163-002`: Checkout URL parameter contract; resolved, because the route already reads the required parameters.
- `DEP-163-003`: Execution branch alignment; unresolved until the repository is on the Linear REN-163 branch.
- `SEC-163-001`: Same-origin navigation boundary; the destination is assembled only from fixed route names and encoded local values.

## Test expectations

- `TEXP-163-001` (`unit`, REQUIRED): Test destination construction for normal cart, Buy Now, and swap-reward contexts, including omitted optional values.
- `TEXP-163-002` (`component`, REQUIRED): Test the shared payment options callback uses the supplied cancellation path after dismissal and preserves existing modal state transitions.
- `TEXP-163-003` (`regression`, REQUIRED): Assert payment success/order creation code paths and existing normal-cart fallback are unchanged.
- `TEXP-163-004` (`security`, REQUIRED): Assert only same-origin fixed routes are produced and query values are URL-encoded.
- `TEXP-163-005` (`e2e`, REQUIRED): Manually verify cancellation from Buy Now, swap-reward, and normal cart in a browser with Razorpay test mode.
- `TEXP-163-006` (`unit`, REQUIRED): Assert incomplete Buy Now/swap-reward context falls back to `/mycart`, dismissal state remains intact, and cancellation wiring does not suppress a later success callback.

## Explicit exclusions

- No change to payment verification, signature validation, order creation, stock, cart deletion, payment reconciliation, or payment-success redirects.
- No change to corporate Razorpay payment callers.
- No automatic retry or `router.back()` behavior.
