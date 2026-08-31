# Evidence Index — P05 Customer Journey & UX

All paths relative to repository root `renivet-marketplace`. Line numbers reflect the file state read on 2026-08-30 and may drift as the code changes.

| Claim | Classification | Evidence |
|---|---|---|
| No `db.transaction()` wraps order creation | CONFIRMED | `src/lib/trpc/routes/general/orders.ts`, `createOrder` mutation, lines 251–670+; no `db.transaction` call in the file |
| Orders created per line item, not per brand | CONFIRMED | `src/lib/trpc/routes/general/orders.ts` line 536: `for (const [index, item] of input.items.entries())`, one `queries.orders.createOrder()` call per item |
| Client swallows per-brand order-creation failures and continues | CONFIRMED | `src/lib/razorpay/payment.ts` lines ~174–216, `try { await createOrder(...) } catch (error) { ...; // Continue with the next order even if one fails }` |
| Overall flow only fails if zero orders succeeded | CONFIRMED | `src/lib/razorpay/payment.ts` line ~218: `if (createdOrders.length === 0) throw new Error(...)` |
| `ordersIntent.orderLog` is a progress log, not a transactional guard | CONFIRMED | `src/lib/trpc/routes/general/orders.ts` lines ~619–636: `db.update(schemas.ordersIntent).set({ orderLog: { step: "order_created_in_database", ... } })` runs once per successfully created order, no rollback path |
| Razorpay webhook handlers exist as a separate write path | CONFIRMED (existence only) | `src/app/api/webhooks/razorpay/payments/route.ts`, `.../refunds/route.ts`, `.../subscriptions/route.ts` — internal reconciliation logic UNKNOWN, not opened in this pass |
| `/checkout` hard-redirects unauthenticated visitors | CONFIRMED | `src/app/(protected)/checkout/page.tsx`: `if (!userId) redirect("/auth/signin?redirect_url=/checkout")` |
| `createOrder` requires an authenticated, matching user | CONFIRMED | `src/lib/trpc/routes/general/orders.ts` line 251 (`protectedProcedure`) and inline `.use()` middleware checking `ctx.user.id === input.userId` |
| `orders.userId` is NOT NULL with FK to `users` | CONFIRMED | `src/lib/db/schema/order.ts` lines 25–29 |
| `/mycart` shows a guest-specific view instead of redirecting | CONFIRMED | `src/app/(protected)/mycart/page.tsx` lines 35–39: `if (!userId) return <GuestCartPage />;` |
| Two independent checkout implementations | CONFIRMED | `src/app/(protected)/checkout/checkout-content.tsx` vs. `src/app/(protected)/mycart/Component/payment-stepper/payment.tsx` + `cart-data-fetcher.tsx` |
| TRYNEW20 auto-apply logic duplicated in a third surface | CONFIRMED | Identical `AUTO_COUPON_CODE`/`AUTO_COUPON_MIN_CART_VALUE` constants and effect logic in `checkout-content.tsx` (lines 55–56, 723–752), `mycart/Component/checkout-section.tsx` (lines 39–40, 224–243), and `components/globals/modals/profile/checkout.tsx` (lines 37–38, 159–175) |
| Cart line-item component has no availability logic | CONFIRMED (absence) | `src/app/(protected)/mycart/Component/product-cart-card.tsx` — zero matches for isAvailable/isActive/unavailable/out-of-stock patterns |
| Availability filtering exists only at checkout time | CONFIRMED | `checkout-content.tsx` lines 181–194, `availableItems` `useMemo` predicate |
| TRYNEW20 auto-applies with no client-side new-customer check | CONFIRMED | `checkout-content.tsx` lines 723–752: trigger is `cartValue > AUTO_COUPON_MIN_CART_VALUE` only |
| Server-side new-customer eligibility enforcement for TRYNEW20 | UNKNOWN | `trpc.general.coupons.validateCoupon` implementation not opened in this pass |
| Cancellation always redirects to `/mycart` | CONFIRMED | `src/lib/razorpay/payment.ts`, `modal.ondismiss`: `window.location.href = "/mycart"`, unconditional |
| Cart page browser tab reads "Profile \| Renivet" | CONFIRMED | `src/app/(protected)/mycart/page.tsx` lines 22–27: `metadata.title = { default: "Profile", template: "%s \| " + siteConfig.name }` |
| REN-95 blocked on 6 unresolved decisions | INFERRED | `docs/enhancement-improvements/07-decisions/DECISION_QUEUE.md`, row `DECISION-P05-001` through `006`; the 6 decisions themselves are not enumerated in that file and were not opened in `docs/.work-items/` in this pass |
| Customization-request silent-data-loss bug in one checkout implementation | INFERRED | Carried forward from prior portfolio pass; not independently re-derived |
| REN-108, REN-110, REN-112 | INFERRED | Carried forward from prior pass; not re-derived from source (wishlist page, search modal, homepage interstitial not opened in this pass) |
| DEF-002, DEF-003 mechanism details | UNKNOWN (beyond risk register text) | `08-risks/PORTFOLIO_RISK_REGISTER.md` rows for DEF-002/DEF-003; underlying fulfillment/inventory code not opened in this pass |
