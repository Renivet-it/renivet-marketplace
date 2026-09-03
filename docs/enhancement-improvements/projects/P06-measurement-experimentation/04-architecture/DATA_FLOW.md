# Data Flow — P06

## Add-to-cart flow

```
User clicks "Add to cart"
  -> useAddToCartTracking.trackAddToCartEvent()
       -> trackAddToCart(productId, brandId)          [DB write: product interest tracking]
       -> posthog?.capture("add_to_cart", {...})        [client PostHog, rupees via convertPaiseToRupees]
       -> fbEvent("AddToCart", {...})                    [client Pixel, rupees]
       -> trackAddToCartCapi(...) -> sendCapiEvent(...)  [server CAPI, rupees, logged to capiLogs]

(separately, on the actual cart-mutation backend call)
tRPC cart.addProduct
  -> queries.userCarts.addProductToCart() OR updateProductInCart()  [DB write]
  -> posthog.capture("cart_added", {...})                [server PostHog, unconditional]
  -> analytics.track(BRAND_EVENTS.CART.ADDED, {...})      [brand-level analytics, separate system]
```
Two independent event families (`add_to_cart` vs `cart_added`) fire from two independent triggers (a UI hook call vs. a backend mutation) — see REN-132 and `05-algorithms/DECISION_LOGIC.md`.

## Purchase-completion flow (current, defective)

```
Customer completes payment (Razorpay or COD)
  -> tRPC orders.createOrder.mutateAsync(orderDetailsForBrandA)   [order record A created]
       -> onSuccess(orderA, variablesA)
            -> posthog?.capture("purchase_completed", {total_amount: convertPaiseToRupees(variablesA.totalAmount)})   [CORRECT unit]
            -> fbEvent("Purchase", {value: variablesA.totalAmount})                                                    [WRONG unit: paise]
            -> trackPurchaseCapi(..., {value: variablesA.totalAmount}) -> sendCapiEvent(...)                          [WRONG unit: paise]
  -> tRPC orders.createOrder.mutateAsync(orderDetailsForBrandB)   [order record B created, MULTI-BRAND CART]
       -> onSuccess(orderB, variablesB)
            -> (same three calls repeat, independently, for brand B's subtotal)
```
For an N-brand cart: N `createOrder` calls -> N independent `onSuccess` firings -> N PostHog purchase events (correct unit each, but N events instead of 1) and N Meta Purchase events (each in paise, each ~100x its own already-partial subtotal). This is the fan-out defect (REN-145b) compounding the currency defect (REN-145a).

## Purchase-completion flow (target, V1 fix — conceptual, not a design mandate)

```
Customer completes payment
  -> N tRPC orders.createOrder calls (per brand) still happen — internal order-splitting is a legitimate business need, unrelated to this fix
  -> AFTER all N order records for this checkout are confirmed created:
       -> ONE purchase-completion event fires, keyed by a checkout/payment-intent ID (not per-brand order ID), with:
            - PostHog purchase_completed: total = sum of all brand subtotals, in rupees
            - Meta Pixel + CAPI Purchase: value = same total, in rupees, one event
       -> Ideally triggered from (or mirrored by) a server-side point (order-intent linking, e.g. linkOrderIntentToOrder, or a payment-confirmation webhook) to satisfy REN-131 as well
```
See `05-algorithms/TARGET_ALGORITHM.md` for the reconciliation logic in more detail.

## Reconciliation flow (why 11 / 15 / 2 / 0 differ)

```
Meta (11)        <- CAPI + Pixel dedup, server+client, attribution-window-limited, currently subject to REN-145's defects
PostHog raw (15) <- client-side purchase_completed captures, no dedup against multi-brand fan-out, more permissive counting
PostHog strict (2) <- same raw events, filtered by a stricter definition (e.g., requiring a verified session/identity match) -- MEASUREMENT ARTIFACT of the filter, not a real drop to "2 purchases"
GA4 (0)          <- event never fires; not wired up at all (REN-166)
```
See `05-algorithms/DECISION_LOGIC.md` for the full reconciliation explanation.
