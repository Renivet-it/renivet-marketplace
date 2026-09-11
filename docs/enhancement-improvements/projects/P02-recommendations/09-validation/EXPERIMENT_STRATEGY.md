# Experiment Strategy — P02

## V1 items (REN-147/150/157/160): no experiment needed

These are confirmed-defect fixes, not hypotheses to test — validation is via `TEST_STRATEGY.md` (correctness) and `ACCEPTANCE_CRITERIA.md` (behavior), not an A/B experiment. Running an experiment to check "did fixing a confirmed bug help" would be process overhead disproportionate to the nature of the change (see `11-critique/ANTI_OVERENGINEERING_REVIEW.md`).

## REN-165: this IS an experiment/verification question

**Recommended phased approach (per `07-feasibility/ALTERNATIVES.md`):**

**Phase 1 — lightweight verification (recommended starting point):**
- Qualitative review: how do comparable e-commerce experiences use post-purchase real estate? (desk research, not a build)
- Low-cost signal check: review whether shoppers who see the *existing* order-confirmation page show any exploitable behavior pattern in already-available analytics (e.g., do they navigate back to `/shop` afterward at a notable rate? — **UNKNOWN**, would need a one-off analytics query against existing PostHog/analytics data, not new instrumentation)
- A short, optional shopper survey (if the business has a channel for this) asking whether post-purchase suggestions would be welcome
- **Output:** a GO / NO-GO / INSUFFICIENT-DATA verdict on whether to proceed to Phase 2

**Phase 2 — instrumented pilot (only if Phase 1 is inconclusive-but-promising):**
- Build a minimal post-purchase recommendation surface (reusing Placement C's Postgres-based order-history scorer, per `05-algorithms/TARGET_ALGORITHM.md`'s directional note) behind a feature flag or to a small traffic percentage
- Add impression/click event instrumentation (addressing the gap named in `08-reliability/OBSERVABILITY.md`) at the same time, since it wouldn't exist otherwise
- Measure against a predefined metric (see `SUCCESS_METRICS.md`) for a fixed window
- **Output:** a data-backed GO/NO-GO on full rollout

**This package does not commit to Phase 2 happening** — it is contingent on Phase 1's outcome, per REN-165's PROBABLE-not-confirmed status.

## REN-168: no experiment strategy defined

Explicitly out of scope until the demonstrated-need gate (`10-roadmap/VERSION_TRIGGERS.md`) is met — at that point, a genuine experiment (e.g., A/B testing a co-occurrence-based cross-sell against the current similarity-based one) would be the appropriate validation method, but designing that experiment now would be premature per the deferred/gated status.
