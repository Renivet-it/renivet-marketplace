# Performance — P02

## Current performance profile (CONFIRMED structurally, not measured — no latency data exists in the repo)

- **Placement A (cart cross-sell):** up to 3 parallel external HTTP calls (primary), each with no timeout set, plus a Postgres hydration query; in the fallback branch, one more external HTTP call (embedding generation) plus a pgvector similarity query. Worst case (primary fails, fallback also runs): 4 sequential-ish external round-trips (3 parallel + 1) plus 2 DB queries, all on every single cart-page load with items in cart, uncached.
- **Placement B (PDP):** 1 external HTTP call (primary) plus, in the worst case (primary empty), up to 3 additional sequential Postgres queries (same-brand → same-category → best-sellers, each only firing if the previous tier was empty) — bounded, but still uncached and recomputed on every PDP view.
- **Placement C (shop sort):** up to 4 parallel DB sub-queries (`Promise.allSettled` over browsing/wishlist/search) plus a `userHasOrders` check plus the final `getProducts` call — all Postgres, no external HTTP, but still a nontrivial multi-query fan-out recomputed on every qualifying shop-page load, uncached.

## Performance impact of V1 fixes

- **FR-1 (new fallback tier):** adds a *new* query path only in the failure case (primary+existing-fallback both empty) — no performance cost in the common/happy path where the primary ML call succeeds. Net performance effect: neutral in the common case, strictly better in the failure case (a fast Postgres fallback vs. the current failure-then-nothing).
- **FR-4 (caching):** the primary lever for actual performance improvement. Cache hits collapse the multi-call/multi-query paths above to a single cache read for both Placement A/B (product-keyed) and Placement C (user-keyed), within the proposed TTL windows. This is the only V1 item with a direct, expected latency/cost improvement — REN-147/150/157 are correctness/trust fixes, not performance fixes (FR-1 is perf-neutral-or-better, not perf-negative; it should not be read as adding meaningful new load in the common path).
- **FR-2 (rank fix):** negligible performance delta — swapping a 2-branch `CASE` for an N-branch `CASE` over a bounded (≤50) ID list is not a meaningfully more expensive query.

## Targets (INFERRED, proposed for discussion — not measured baselines)

See `03-requirements/NON_FUNCTIONAL_REQUIREMENTS.md` NFR-3/NFR-4 for proposed cache-hit latency and TTL targets. No committed SLO exists today for any of these three placements to compare against.

## Load/scale note

No current traffic/QPS data for these endpoints was available in this pass (**UNKNOWN**) — the performance case for FR-4 is made on architectural grounds (uncached external calls and multi-query fan-outs are inherently more expensive than a cache read) rather than from a demonstrated current bottleneck. If traffic to these surfaces is currently low, FR-4's urgency is lower than its correctness-adjacent siblings (FR-1/2/3); this package still recommends shipping it as scoped (REN-160 is already a tracked, prioritized backlog item) but flags that its priority-within-V1 could reasonably be sequenced last if resourcing is constrained (see `10-roadmap/V1.md`).
