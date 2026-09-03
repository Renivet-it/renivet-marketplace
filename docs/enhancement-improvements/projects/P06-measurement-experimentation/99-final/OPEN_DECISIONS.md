# Open Decisions — P06

## DECISION REQUIRED

- **DECISION-P06-001** (owned by product, tracked in `docs/enhancement-improvements/07-decisions/DECISION_QUEUE.md`): Is GA4 needed as a second revenue-reporting source at all, or is PostHog+Meta sufficient? Blocks REN-166 scheduling. Evidence available: `docs/growth-audits/2026-08-23/ga4_device_sessions.csv` (GA4 e-commerce columns currently all zero, confirmed unwired not confirmed zero-revenue).

## Implementation-level decisions left to whoever picks up the work (not product/business decisions, but not pre-decided here either)

- Exact server-side trigger point for REN-131's capture (order-confirmation webhook vs. `linkOrderIntentToOrder` hook vs. reconciliation cron) — see `05-algorithms/TARGET_ALGORITHM.md`, deliberately left open as an engineering choice.
- Whether REN-131's server-side capture coexists with or replaces the client-side capture, and exactly how the shared `eventId`/dedup mechanism is extended to cover it — see `08-reliability/RECOVERY_ROLLBACK.md`.
- Whether REN-133's consolidation happens purely within P06's analytics layer or as part of a broader P05-coordinated checkout-logic consolidation (since the underlying `buildOrderDetailsByBrand()` duplication is itself a P05-adjacent concern) — see `07-feasibility/DEPENDENCIES.md`.

## Not a decision — a business action available now, independent of all of the above

Reactivating `Remarketing_Sara` and reassessing Instagram Reels spend allocation. See `00-context/BUSINESS_CONTEXT.md`. Flagged here only to ensure it isn't lost among the items that do require formal decisions.
