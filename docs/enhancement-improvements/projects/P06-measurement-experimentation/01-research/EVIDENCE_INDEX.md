# Evidence Index — P06

| Claim | Classification | Evidence |
|---|---|---|
| REN-128 PostHog identify on login shipped | CONFIRMED | `src/components/globals/posthog/identify-bridge.tsx` — `posthog.identify(user.id, {...})` on sign-in, `posthog.reset()` on sign-out |
| REN-129 delayed init resolved | INFERRED (not re-litigated) | No setTimeout-gated init found in current provider tree; treated as superseded per prior audit |
| REN-130 phone-first-sign-up tracking shipped | CONFIRMED | `src/components/auth/phone-first-sign-up.tsx` references `posthog` |
| REN-131 no server-side purchase_completed capture | CONFIRMED | Zero `posthog.capture` calls for a purchase event in `src/lib/trpc/routes/general/orders.ts` or `src/actions/process-order-after-payment.ts`; only 2 client-side call sites exist codebase-wide |
| REN-132 add_to_cart / cart_added differing trigger surfaces | CONFIRMED (structural) / INFERRED (4.3x magnitude) | `src/lib/trpc/routes/general/cart.ts:172-181,245-` (server, unconditional, dual-branch) vs `src/lib/hooks/useAddToCartTracking.ts:52` (client, single hook call site) |
| REN-133 duplicate purchase_completed instrumentation | CONFIRMED | `checkout-content.tsx:483` and `order-payment-page.tsx:323` — near-identical independent payload construction |
| REN-134 client.tsx is actually server-side | CONFIRMED | `src/lib/posthog/client.tsx` imports `PostHog` from `posthog-node`, not `posthog-js` |
| REN-145 currency-unit defect | CONFIRMED (source) | `checkout-content.tsx:500,524` and `order-payment-page.tsx:340,367` pass `totalAmountPaise`/`variables.totalAmount` (paise) directly as Meta `value`, while the adjacent PostHog capture at line ~490/330 correctly calls `convertPaiseToRupees()` |
| REN-145 per-brand fan-out | CONFIRMED (source) | `buildOrderDetailsByBrand()` in both files + `for (const orderDetails of orderDetailsByBrand) { await retryCreateOrder(orderDetails); }` (COD path, `checkout-content.tsx:885-887`); each `createOrder` mutation fires its own `onSuccess` → own Meta Purchase event |
| REN-145 historical runtime magnitude ("100x") | PROBABLE, not CONFIRMED | Per governing evidence: one real month of Meta-vs-PostHog data did not cleanly fit the expected clean-multiplier theory during QC. Do not upgrade. |
| REN-154 search click/result-count is a no-op stub | Cited from P01, not re-derived | `docs/enhancement-improvements/DEPENDENCY_GRAPH.md` P06→P01 edge |
| REN-162 extend product-click tracking | Cited from prior audit, not re-derived | Prior portfolio-governance pass |
| REN-164 PostHog init-timing race | UNCONFIRMED / verification-only | No init-timing race found or reproduced in this pass; issue title itself says "[Verification]" |
| REN-166 GA4 e-commerce events not wired up | CONFIRMED gap, DEFERRED | No `gtag`/GA4 code in `src/`; `docs/growth-audits/2026-08-23/ga4_device_sessions.csv` shows `conversions_purchase`/`total_revenue` = 0 for every row |
| ₹77,615 spend / 11 Meta-attributed purchases / ₹7,057 CPA | Given ground truth, not recomputed | `docs/growth-audits/2026-08-23/README.md`, referenced Attribution/Marketing Action Brief reports |
| Remarketing_Sara 82% of purchases, 4.9x CPA, paused | Given ground truth, not recomputed | Governing task evidence; growth-audit data pull corroborates campaign-level Meta Ads data existing in `meta_ads_monthly_v2.csv` |
| 100% of attributed purchases age 25-34 | Given ground truth, not recomputed | Governing task evidence |
| Instagram Reels 33.8% spend, 0 purchases | Given ground truth, not recomputed | Governing task evidence |
| Meta 11 / PostHog raw 15 / PostHog strict 2 / GA4 0 | Given ground truth, not recomputed | Governing task evidence; directionally consistent with (not identical to) `posthog_purchases_by_month.csv`'s different aggregation window |
| PostHog-strict-2 is a measurement artifact, not a real business signal | Given ground truth — preserve exactly | Governing task evidence |
| GA4 = 0 because unwired, not because zero purchases | CONFIRMED | Same as REN-166 evidence above |

## Files read directly in this pass

`src/config/posthog.ts`, `src/lib/posthog/client.tsx`, `src/components/globals/posthog/identify-bridge.tsx`, `src/components/globals/posthog/page-view.tsx`, `src/lib/fb-capi.ts`, `src/actions/analytics.ts`, `src/lib/hooks/useAddToCartTracking.ts`, `src/lib/trpc/routes/general/cart.ts`, `src/app/(protected)/checkout/checkout-content.tsx`, `src/app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx`, `docs/growth-audits/2026-08-23/README.md`, `docs/growth-audits/2026-08-23/posthog_purchases_by_month.csv`, `docs/enhancement-improvements/02-epics/EPIC_MAP.md`, `docs/enhancement-improvements/DEPENDENCY_GRAPH.md`, `docs/enhancement-improvements/01-portfolio/MASTER_REGISTER.md`, `docs/enhancement-improvements/07-decisions/DECISION_QUEUE.md`.
