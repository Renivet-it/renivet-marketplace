# Alternatives Considered — P06

## For REN-145 (currency + fan-out)
- **Alternative A (recommended, see TARGET_ALGORITHM.md)**: fix unit conversion at the two existing call sites; restructure firing to happen once per checkout, after all per-brand orders are confirmed.
- **Alternative B**: fix unit conversion only, leave fan-out as-is (accept N smaller-but-correct-value events per checkout). Rejected as insufficient — still violates BR-2 (one purchase = one conversion) and still distorts Meta's reported purchase *count*, not just value.
- **Alternative C**: build the full shared commerce-event abstraction and fix REN-145 as a side effect of that refactor. Rejected for V1 — see `BUILD_REUSE_BUY_SIMPLIFY.md`; too much scope for a P0-urgent fix.

## For REN-131 (server-side capture)
- **Alternative A (recommended)**: add a `posthog-node` capture call at a server-side confirmation point (mirrors the pattern already proven in `cart.ts`).
- **Alternative B**: rely on a nightly reconciliation job comparing Razorpay/COD order records against PostHog captures, backfilling gaps. Rejected as primary fix — adds latency/complexity and a new batch job to maintain; could be a secondary safety net later, not a V1 requirement.

## For REN-132 (add_to_cart vs cart_added)
- **Alternative A (recommended)**: keep both events, document trigger semantics. See `DECISION_LOGIC.md`.
- **Alternative B**: merge into a single event name with a `source: "client" | "server"` property. Rejected — would break existing PostHog dashboards/insights built against the current two event names (violates NFR-4), for a benefit (slightly simpler event list) that doesn't outweigh the migration cost.

## For REN-166 (GA4)
- **Alternative A**: instrument GA4 e-commerce events. Only proceed if DECISION-P06-001 approves.
- **Alternative B (status quo)**: do not add GA4; rely on PostHog + Meta only. Equally valid pending the same decision — this document takes no position on which alternative is correct, consistent with the instruction not to fabricate a recommendation the evidence doesn't support.
