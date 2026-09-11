# Alternatives Considered — P02

## REN-147 alternatives

1. **(Recommended) Port PDP's Postgres-based fallback chain to cart.** Pros: proven pattern, low risk, no new infra. Cons: cart's multi-item cart composition needs a small design decision PDP didn't need (single product vs. up to 3).
2. **Add a second external ML host/region for redundancy.** Pros: preserves ML-based fallback quality. Cons: real infra/ops cost, a new vendor/deployment relationship, disproportionate to a "backlog, high" (not P0/outage-in-progress) issue. **Rejected as disproportionate** — the confirmed defect is architectural coupling, not "the ML service needs more redundancy," and REN-146 (P01's issue) already covers hardening the existing host.
3. **Do nothing, rely on REN-146's hardening (timeouts) alone.** Pros: less work. Cons: does not address the core defect — a hardened-but-still-single host that goes fully down still takes out cart cross-sell entirely; timeouts reduce *how long* a shopper waits before the failure, not *whether* the fallback is real. **Rejected as insufficient** — REN-146 and REN-147 are complementary, not substitutes (per `DEPENDENCIES.md`).

## REN-150 alternatives

1. **(Recommended) True position-preserving `CASE` ordering.** See `05-algorithms/TARGET_ALGORITHM.md` Option 1.
2. **Coarse N-tier bucketing.** See Option 2 — simpler, less precise; viable if the exact-rank SQL is deemed too fiddly to maintain (subjective judgment call, **DECISION REQUIRED**).
3. **Pass a numeric score column instead of an ID list and `ORDER BY` that score directly.** Would require `getPersonalizedRecommendations` to expose per-product scores (currently it exposes rank via array order, not explicit scores) — a larger change to the upstream contract for no clear benefit over Option 1, since array order already encodes the needed information. **Rejected as unnecessary complexity** for what array-order-based `CASE` ordering already solves.

## REN-160 alternatives

1. **(Recommended) `unstable_cache`/Redis with TTL, per `DECISION_LOGIC.md` keying.**
2. **Precompute recommendations via a scheduled batch job instead of caching on read.** Pros: zero read-path latency ever. Cons: real new infrastructure (a job scheduler/cron entry, a "recompute all users' personalization nightly" job) — disproportionate to a "backlog, medium" caching request, and introduces staleness the current on-demand model doesn't have (a shopper's brand-new browsing session wouldn't be reflected until the next batch run). **Rejected as overengineered relative to confirmed scope** — see `11-critique/ANTI_OVERENGINEERING_REVIEW.md`.

## REN-165 alternatives (for the verification approach itself)

1. **(Recommended) Lightweight qualitative/analytics-based verification** (e.g., review whether comparable surfaces — cart cross-sell, PDP — show meaningful engagement, as a weak proxy; or a short survey) before committing to instrumentation-heavy A/B testing.
2. **Full instrumented A/B test with a built (not just mocked) post-purchase surface.** Higher cost, higher confidence — appropriate only if the lightweight verification is inconclusive. Sequencing, not exclusion: option 1 first, option 2 only if needed (see `09-validation/EXPERIMENT_STRATEGY.md`).
