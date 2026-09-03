# Performance — P01

Every number below is tagged KNOWN / ESTIMATED / UNKNOWN. Do not treat ESTIMATED as measured.

| Metric | Value | Status |
|---|---|---|
| Current external-call latency (embeddings, RAG, recommendations) | — | UNKNOWN — no APM/timing instrumentation found in the repo |
| Current search end-to-end latency (customer-perceived) | — | UNKNOWN |
| Latency saved by REN-151's parallelization | Roughly the duration of the faster of the two branches (embedding+brand-match vs. RAG fetch) | ESTIMATED — directionally correct by construction (parallel ≤ sequential), exact magnitude UNKNOWN without real timing data |
| Cache hit-rate achievable from REN-159 | — | UNKNOWN — depends on real category-browse traffic patterns not available in this pass |
| DB cost of the ILIKE fallback predicate when RAG already succeeded | Non-zero, proportional to table size and correlated-subquery cost | ESTIMATED as "real but unmeasured" — plausible based on the query shape (4 ILIKE + 4 correlated EXISTS subqueries per candidate row), no EXPLAIN ANALYZE run in this documentation-only pass |
| Current timeout ceiling on external calls | None (unbounded up to platform limits) | CONFIRMED (this is the defect, not a metric to optimize) |
| Target timeout value for REN-146 | — | UNKNOWN / DECISION REQUIRED — recommend picking conservatively and tuning with real data once available, see `03-requirements/NON_FUNCTIONAL_REQUIREMENTS.md` |

## What instrumentation would be needed to get real numbers

1. **REN-154** (result-count + click logging) — the direct prerequisite named in this Epic's own backlog for measuring search-quality-adjacent metrics.
2. Request-level timing spans around each external call (not currently in scope of any single issue here, but a natural companion to REN-146 — recommend adding simple `console.time`/structured-log duration capture as part of implementing REN-146's timeout, since the code will already be touching that exact call site).
3. Cache hit/miss counters for REN-159's implementation, so its own effectiveness can be measured rather than assumed.

## Recommendation

Do not commit to a numeric SLA (e.g. "search must return in Xms") until instrumentation from #2 above exists. Setting a target without a baseline risks either an unachievable commitment or a meaninglessly loose one.
