# Observability — P02

## Current state (CONFIRMED)

- Error handling across all three placements relies on `console.error`/`console.log` (e.g., `cart.ts:750-756,811-813,922-925`, `recommendation.ts`'s per-branch `catch` blocks) — no structured logging, no alerting, no metrics/dashboards specific to recommendations were found.
- No distinction exists in logs between "external ML host is down" (an infra/vendor problem) and "genuinely no similar products found" (an expected, benign empty result) — both currently produce either a caught exception logged to console or a silent empty array, with no differentiated signal. This is precisely why REN-147's failure mode is described as "silent" — there is no existing mechanism (dashboard, alert, or even a distinguishable log pattern) by which the business would learn a full outage was happening, short of a shopper complaint or someone noticing the cart page looks sparse.
- PostHog/brand-events analytics exist for cart/wishlist actions but not for recommendation impressions, clicks, or fallback-tier usage (confirmed absence, per `04-architecture/INTEGRATIONS.md`).

## Target observability for V1 (per NFR-7)

- **FR-1:** log (at minimum) which tier served a given cart cross-sell request (primary ML / same-host vector fallback / new independent DB fallback / genuine empty) — even simple structured console logging with a `tier` field would let someone `grep` logs to detect a REN-147-style outage recurrence, which is strictly better than today's undifferentiated `console.error`.
- **FR-4:** log or metric cache hit/miss for both cache points (Placement A/B product-keyed, Placement C user-keyed) — needed both to validate FR-4 shipped correctly (AC-4) and to tune TTLs post-launch.
- No new dashboard, alerting platform, or APM tool is proposed as required for V1 — the target is "make the failure/tier information exist and be greppable/logged," not "stand up new observability infrastructure." A proper dashboard is a reasonable V2 idea (ties to P06/measurement) but is not a confirmed requirement here.

## Gap this leaves for REN-165's verification

Because no recommendation-impression/click events exist, REN-165's verification (`09-validation/EXPERIMENT_STRATEGY.md`) cannot lean on existing analytics and must use a lighter-weight method (survey, qualitative review) unless impression/click instrumentation is added first — named here as the same gap surfacing from a different angle (observability vs. measurement), consistent with `06-data/DATA_REQUIREMENTS.md` and `09-validation/SUCCESS_METRICS.md`.
