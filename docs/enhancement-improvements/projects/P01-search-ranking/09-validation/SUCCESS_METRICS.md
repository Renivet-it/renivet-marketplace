# Success Metrics — P01

## What can be measured immediately after shipping (no new data needed)

| Metric | Confirms |
|---|---|
| External-call timeout actually fires under simulated slow/hung conditions | REN-146 |
| Search-bar submit navigates to the correct intent-based URL for brand/category/subcategory/product-type queries | REN-149 |
| Wall-clock latency of the brand-embedding + RAG-fetch pair drops relative to the pre-change sequential baseline | REN-151 |
| `count` equals `data.length`'s true cross-page total under `requireMedia` | REN-155 |
| Build succeeds and no runtime behavior changes after `ai-suggestion.ts` deletion | REN-156 |
| ILIKE predicate absent from generated SQL when RAG returns candidates (verifiable via query-log inspection or unit test on predicate construction) | REN-158 |
| Cache hit observed on a repeated identical category-only request within TTL | REN-159 |

## What requires REN-154's data to accumulate before it can be measured (UNKNOWN today, not a target yet)

- Search click-through rate
- Search-to-purchase conversion
- RAG-vs-ILIKE fallback activation rate (only if the recommended extension in `05-algorithms/DECISION_LOGIC.md` is implemented)
- Any latency percentile (p50/p95/p99) for search requests

## No numeric target is set in this document

Consistent with `08-reliability/PERFORMANCE.md`: setting a target (e.g. "click-through rate should be X%") without a baseline is not credible. This Epic's own success is defined by the per-issue metrics above (did the fix do what it says), not by a business KPI target, which remains **DECISION REQUIRED** for whoever owns search once REN-154's data exists.
