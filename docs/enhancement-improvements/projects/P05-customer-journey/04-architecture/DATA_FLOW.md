# Data Flow — P05 Customer Journey & UX

## Current checkout data flow (CONFIRMED, `/checkout` surface — `/mycart` step 2 is structurally equivalent)

1. Client loads cart (`trpc.general.users.cart.getCartForUser`) and computes `availableItems` (availability filter applied here, and only here).
2. Client computes `priceList` (items, discount, coupon, delivery) and calls `orders.previewCheckoutTax` for GST lines.
3. Customer clicks "Confirm & Pay". Client calls `orderIntent.createIntent` (writes an `ordersIntent` row — pre-payment).
4. Client calls `getShiprocketBalance` (creates the Razorpay order id server-side, despite the misleading function name).
5. Client opens Razorpay Checkout.js with the order id. **Razorpay captures payment here, client-side, before any Renivet order row exists.**
6. Razorpay calls the client `handler` callback with the payment payload.
7. `handler` calls `verifyPayment(payload)` (signature verification).
8. `handler` loops `orderDetailsByBrand`, calling `orders.createOrder` once per brand group — **each iteration independently try/caught; a failure logs and the loop continues.**
9. Inside `orders.createOrder` (server), a second loop runs **per line item** (not per brand), calling `queries.orders.createOrder()` and inserting an `orderItems` row — no transaction wraps this loop.
10. After each successful per-item order, `ordersIntent.orderLog` is updated with a JSON progress marker.
11. `handler` calls `processOrderAfterPayment` (stock deduction, payment status) per successfully created brand-order.
12. If `createdOrders.length > 0` (at least one brand-group succeeded), the flow proceeds to WhatsApp notification, cart clearing, and redirect to `/profile/orders` as a **success** — even if some brand-groups/items failed at step 8/9.
13. Independently and asynchronously, Razorpay may deliver a webhook to `src/app/api/webhooks/razorpay/payments/route.ts` — its role in this flow is UNKNOWN (not traced).

## Where data can be lost or become inconsistent

- Between step 5 (capture) and step 9 (order row committed): any client crash, network loss, or tab close loses the order-creation attempt entirely, with payment already captured. `ordersIntent` records intent but nothing automatically retries or alerts.
- Step 8's catch-and-continue: one brand's order-creation exception (e.g., a transient DB error, a stale product/brand lookup) does not stop other brands' orders, and does not surface to the customer as anything other than success — they see "Order Placed Successfully" and are redirected, unaware a brand's items were dropped.
- Step 9's per-item loop: a mid-loop failure (e.g., item 2 of 3 fails) leaves items 1 and 3 as orders and item 2 as neither an order nor a refunded charge — the exact "partial order" scenario REN-144 describes, now confirmed at item granularity.

## Guest checkout data flow gap (REN-95)

No guest-identity data flow exists today — `input.userId` and `ctx.user.id` are assumed non-null and equal at every step from `orderIntent.createIntent` onward. Introducing guest checkout means threading a guest identity (mechanism TBD, `03-requirements/BUSINESS_RULES.md` BRule-5) through every one of the 13 steps above, or branching a guest-specific path that converges before step 9's schema write.
