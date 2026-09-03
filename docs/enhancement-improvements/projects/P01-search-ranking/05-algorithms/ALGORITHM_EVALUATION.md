# Algorithm Evaluation — P01

## Can this be evaluated today?

**No** — CONFIRMED. There is no click-through data, no result-count-per-search log, no fallback-source tracking, and no A/B or offline evaluation harness for either subsystem. `logSearchClick` is a stub (REN-154). This is not a gap this Epic's other issues can route around — it's a hard prerequisite for any quality evaluation.

## What could be evaluated once REN-154 ships

| Metric | What it would tell you | Needs beyond REN-154's stated scope? |
|---|---|---|
| Search → click-through rate | Whether returned results are relevant enough to click | No |
| Search → purchase rate | Whether search-driven sessions convert | Needs linking search events to order events (P06-adjacent, likely out of P01's scope) |
| RAG-fallback activation rate | How often ILIKE fires vs. RAG succeeding | Yes — fallback-source isn't in REN-154's literal title; see `05-algorithms/DECISION_LOGIC.md`'s recommendation to add it |
| Brand-intent-redirect usage rate | How often REN-149's fix actually changes user paths, once shipped | No — derivable from existing `searchAnalytics.intentType` column already being written |
| Query→zero-results rate | Where the catalog or search is failing customers outright | No — derivable from result-count logging alone |

## Evaluation approach for this Epic's own fixes (not the algorithm itself)

Each fix in this Epic is evaluable by direct correctness/latency testing (see `09-validation/TEST_STRATEGY.md`), not by a ranking-quality metric — e.g. REN-151's success criterion is "wall-clock time for the parallel branch pair," not "are results better." Do not conflate "did the fix work" (testable now) with "is search good" (not measurable until REN-154 ships and accumulates data).

## Recommendation

Do not attempt to evaluate ranking quality as part of this Epic. Ship REN-154 first; revisit evaluation as a distinct, later initiative once data exists — consistent with `10-roadmap/V2.md`'s trigger-based gating.
