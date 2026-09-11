# Research Summary — P05 Customer Journey & UX

Method: direct source inspection of `renivet-marketplace` (Next.js/tRPC/Drizzle/Postgres, Razorpay payments, Delhivery fulfillment) as of 2026-08-30, cross-checked against the prior portfolio-governance pass's summary. Every claim below is classified CONFIRMED / INFERRED / UNKNOWN / DECISION REQUIRED.

## REN-144 — Payment/order integrity (P0)

**CONFIRMED, and the QC "broader than scoped" finding is itself confirmed and sharpened.**

- `src/lib/trpc/routes/general/orders.ts`, `createOrder` mutation (line 251 onward): orders are created inside a `for (const [index, item] of input.items.entries())` loop — **one order row per line item**, not per brand as originally described. No `db.transaction()` call exists anywhere in the file's `createOrder` mutation.
- `src/lib/razorpay/payment.ts`: the Razorpay `handler` callback fires only after Razorpay has already captured payment client-side. Inside it, `verifyPayment(payload)` runs, then a `for` loop over `orderDetailsByBrand` calls the `createOrder` mutation per brand group, **wrapped in a try/catch that logs the error and explicitly continues to the next iteration** (comment: "Continue with the next order even if one fails"). The overall flow only throws if `createdOrders.length === 0` — i.e., partial success (payment captured, some but not all brand-groups/items ordered) is treated as a normal, no-error path and the customer is redirected to `/profile/orders` believing the purchase succeeded.
- A `retryCreateOrder` client-side wrapper retries a single order-creation call up to 3 times with exponential backoff — this masks transient failures but does not make the overall multi-item/multi-brand operation atomic, and does not help once retries are exhausted (the surrounding catch-and-continue still applies).
- An `ordersIntent` row is created before payment and updated with a JSON `orderLog` per successfully created order (`orders.ts`, around the per-item loop). This is a progress log, not a reconciliation mechanism: it is written by the same client-driven path that can partially fail, it is not compared against Razorpay's own capture record, and nothing reads it to detect or repair a partial state.
- Razorpay webhook handlers exist independently at `src/app/api/webhooks/razorpay/{payments,refunds,subscriptions}/route.ts`. Their internal reconciliation logic (whether they can deterministically match a captured payment back to the order rows the client-driven path may have partially created) was **not traced in this pass — UNKNOWN**. The architectural risk described in the original scoping (two independent writers into order state, no single source of truth) is consistent with what was confirmed on the client-driven side.

**Conclusion**: REN-144 is not an edge case — it is a structural gap. Every checkout that creates more than one order row (any multi-brand or multi-item cart) has a code path where a customer can be charged for N items and receive orders for fewer than N, with no automated detection or repair.

## REN-95 — Checkout login wall (three layers, all CONFIRMED)

1. `src/app/(protected)/checkout/page.tsx`: `const { userId } = await auth(); if (!userId) redirect("/auth/signin?redirect_url=/checkout");` — a hard server-side redirect with no guest branch.
2. `src/lib/trpc/routes/general/orders.ts` line 251: `createOrder: protectedProcedure`, plus an inline middleware (`.use(...)`) that further requires `ctx.user.id === input.userId` and `canPlaceCustomerOrder(user)`.
3. `src/lib/db/schema/order.ts` lines 25-29: `userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" })` — the `orders` table cannot hold a row without a real, existing `users.id`.

All three layers must change together for guest checkout to work — a route-level bypass alone would still fail at the tRPC layer, and a tRPC-level bypass alone would still fail the NOT NULL/FK constraint. This is why the item is scoped as the largest single-effort item in the portfolio. Per the prior pass, it is `BLOCKED` on 6 unresolved product/security/finance decisions — see `docs/enhancement-improvements/07-decisions/DECISION_QUEUE.md` (`DECISION-P05-001` through `006`, not individually enumerated there either; the underlying detail lives in the SPEC governance tooling's pilot run, referenced but not opened in this pass — INFERRED that the 6 decisions remain unresolved, not re-verified against `docs/.work-items/`).

## REN-152 — Duplicated checkout logic

**CONFIRMED as scoped (two independent checkout implementations), and found broader in one specific dimension.**

- Two full checkout implementations confirmed: `/checkout` (`checkout-content.tsx`) and `/mycart` step 2 (`payment-stepper/payment.tsx` + `CartFetcher`). Each independently builds `orderDetailsByBrand`, calls `createOrder`, and drives the Razorpay flow.
- The TRYNEW20 auto-apply logic specifically (constant definitions, the `cartValue > AUTO_COUPON_MIN_CART_VALUE` effect, and the silent-apply/silent-remove behavior) is copy-pasted **verbatim into a third surface**: `src/components/globals/modals/profile/checkout.tsx`. This is broader duplication than the "two implementations" framing captures, in the same way REN-144's QC pass found its transaction-boundary gap broader than originally scoped — flagging this as a DECISION REQUIRED item: should REN-152's remediation scope explicitly include the modal checkout, not just the two page-level flows?
- The previously reported customization-request silent-data-loss bug (present in one implementation, not the other) was not independently re-derived in this pass — **INFERRED**, carried forward from the prior pass.

## REN-153 — Cart availability not shown in cart view

**CONFIRMED.** `Component/product-cart-card.tsx` (the cart line-item component rendered by `CartComponent`) contains no availability, stock, active/inactive, or "unavailable" logic of any kind (verified by targeted search — zero matches). The full availability predicate (published, `verificationStatus === "approved"`, not deleted, `isAvailable`, quantity > 0, active, and matching variant checks) exists solely inside `checkout-content.tsx`'s `availableItems` `useMemo`. A customer's cart can silently contain items that will be dropped at checkout, with the first visible sign being a changed total.

## REN-161 — TRYNEW20 disclosure

**CONFIRMED (client-side unconditional trigger, no visible disclosure copy).** The auto-apply effect (present in all three checkout surfaces) triggers purely on `cartValue > AUTO_COUPON_MIN_CART_VALUE`, with no client-side check of new-customer status. Whether `trpc.general.coupons.validateCoupon` enforces new-customer eligibility server-side, and whether the coupon's actual business rule is "new customer" at all versus a generic threshold promo the name misleadingly implies, was **not traced — UNKNOWN**, and is itself the crux of the disclosure question: if the server-side rule truly has no new-customer gate, "new customer" framing in the code name is actively misleading regardless of UI copy.

## REN-163 — Cancellation redirect

**CONFIRMED.** `src/lib/razorpay/payment.ts`, Razorpay modal `ondismiss` handler: unconditional `window.location.href = "/mycart"`. No use of the originating context (Buy-Now item, Swap & Reward redemption, or referring product page) is present anywhere in the dismiss path.

## Guest Journey QA findings (REN-108–112)

Not re-derived from source in this pass except REN-109 and the mechanism behind REN-111, both independently confirmed (see `00-context/CURRENT_STATE.md`). REN-108, REN-110, REN-112 are carried forward as INFERRED from the prior pass.

## Cross-cutting context (referenced, not owned by this Epic)

- REN-101 (zero automated test coverage on the payment/order path) — owned by the Security & Compliance Audit project, cited here as the direct explanation for why REN-144's failure mode could exist undetected.
- DEF-002 (Delhivery shipment stuck "Active" after cancellation) and DEF-003 (inventory double-decrement on cancellation) — untracked portfolio risks (`08-risks/PORTFOLIO_RISK_REGISTER.md`), post-order lifecycle defects relevant to this Epic's reliability picture but not investigated further in this pass (no source trace performed — UNKNOWN beyond what the risk register states).
