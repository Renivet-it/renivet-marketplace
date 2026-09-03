# Success Metrics — P06

## Engineering-verifiable (V1)
- Zero occurrences of a raw paise value in any Meta-bound `CustomData.value` field, verified via `capiLogs` inspection post-fix.
- Exactly one Meta Purchase event (Pixel + CAPI, deduplicated) per completed checkout, verified via `capiLogs` row count per checkout/order-intent ID.
- At least one `purchase_completed` PostHog capture originates from a server-side code path (REN-131 shipped).
- Zero duplicate payload-construction blocks for `purchase_completed` (REN-133 shipped — one shared function, both call sites use it).
- `add_to_cart`/`cart_added` trigger semantics documented and referenced wherever the two are compared (REN-132).
- `src/lib/posthog/client.tsx` renamed or relocated to reflect its server-side nature (REN-134).

## Business-observable (directional only, not a committed target)
- Meta-reported AOV for a comparable post-fix period is directionally consistent with PostHog's rupee-denominated order values, rather than ~100x off.
- Meta-reported purchase *count* for multi-brand-cart-heavy periods is directionally closer to real checkout count than to real order-record count.

## Explicitly not a success metric for this Epic
- Any CAC, LTV, ROAS, or profitability figure — not established by this Epic's evidence base and not to be fabricated as a target.
- A specific target value for the 11/15/2/0 reconciliation gap — no target number is asserted (see `06-data/DATA_QUALITY.md`); only directional narrowing is expected and observable.

## Business (Remarketing_Sara), tracked separately, not an engineering success metric
If marketing reactivates `Remarketing_Sara`, its own campaign-level CPA/purchase-volume trend is the relevant success signal — owned by marketing, not this Epic's engineering acceptance criteria.
