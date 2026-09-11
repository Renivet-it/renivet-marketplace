# Current Algorithm — P01

All CONFIRMED via `src/lib/db/queries/product.ts` and `src/lib/search/search-engine.ts` unless noted.

## Query understanding / intent (Subsystem B, `search-engine.ts`)
Purely rule-based string matching — no ML, no fuzzy edit-distance, no embeddings:
1. Normalize (lowercase, strip non-alphanumeric except `&`/space, collapse whitespace).
2. Brand: exact name/slug → DB alias table → substring partial match (≥3 chars brand-in-query, ≥4 chars query-in-brand).
3. Category/subcategory/product-type: exact keyword-table match → partial keyword-table match → direct name substring match, most-specific-first (product type → subcategory → category).
4. First unmatched stage falls through to the next; if nothing matches, `UNKNOWN`.

This is a decision-tree, not a scored/ranked model — first match wins, no confidence scoring beyond a fixed `high`/`medium`/`low` label assigned per branch.

## Lexical retrieval (ILIKE fallback, Subsystem A)
`ILIKE '%term%'` (substring, case-insensitive, unindexed) against `title`, `description`, `metaTitle`, `metaDescription`, plus correlated `EXISTS` subqueries against brand/category/subcategory/product-type names. No stemming, no ranking (Postgres full-text `tsvector`/`ts_rank` exists as commented-out dead code in `product.ts` schema comments — CONFIRMED present but unused). Substring matching means false positives are possible (e.g. "cat" matches "category," "scatter," etc.) — no evidence this has caused a real complaint, but it is a known weakness of the approach.

## Semantic retrieval (external RAG)
A black-box call to `GET /search/advanced-rag?query=...&limit=150` on the external microservice. **Renivet does not control or observe the ranking algorithm inside this call** — it returns an ordered list of product IDs, and Renivet trusts that order as-is (`CASE id WHEN ... THEN index` preserves it exactly). UNKNOWN what model/algorithm the external service uses internally — out of scope to investigate further per this Epic's boundary (documentation-only, no POCs).

## Candidate generation / fallback chain
```
if exact brand name match:
    candidates = products where brandId = matched brand   # no external call
else:
    embedding = getEmbedding(query)          # for brand fuzzy-match only
    brandMatch = nearest brand by cosine distance < 0.28
    ragIds = fetch RAG endpoint (independent of the above)
    ilikeFallback = ILIKE/EXISTS predicate (always built)
    candidates = ragIds ? (ragIds OR ilikeFallback) : ilikeFallback
```
The `OR ilikeFallback` even when `ragIds` is non-empty is the REN-158 inefficiency: it doesn't change *which* rows can match (ragIds rows already match via `inArray`), it only adds unnecessary predicate-evaluation cost, because any row already selected by `inArray(ragIds)` doesn't need the ILIKE check re-evaluated — the OR is logically redundant whenever `ragIds` is non-empty, not just inefficient.

## Filters (independent of search)
Straightforward boolean/range predicates: active/available/published/deleted/verification/QC status, price range (product OR variant-level), color/size (JSON option matching), discount %, `requireMedia`, collection flags (`isSummerCollection`, `isUnder999`). All CONFIRMED as plain SQL predicates, no ranking interaction except `requireMedia`'s post-query re-filter (see below).

## Ranking / sort (`orderBy` construction, in priority order)
1. New-arrival time-window pin (hardcoded date literals for a "June 2026" promotion — INFERRED to be a one-off, time-boxed rule, not a general pattern; see `03-requirements/BUSINESS_RULES.md`).
2. Priority/personalized product IDs (if supplied — this is P01/P02's interaction point, see below).
3. Best-seller pin.
4. "Under ₹999" collection pin.
5. Brand-match pin (if `topBrandMatch` set).
6. RAG relevance order — **only if** `shouldApplySearchRelevanceOrdering()` returns true (`isRagSearchActive && hasRagResults && !sortBy`) — this is the SE-F002 fix.
7. Discount-percent ascending (if a discount filter is active).
8. User-selected sort (price/createdAt) or default `createdAt desc`.

## Fallback logic
Three independent fallback layers, none of which coordinate with each other explicitly — each just degrades to "don't use this signal":
- RAG fails/times out → `ragProductIds = []`, ILIKE-only candidates, RAG relevance ordering skipped (falls to step 7/8).
- Brand embedding fails → `topBrandMatch = null`, brand-match ordering pin skipped.
- Neither failure affects the other (independent try/catch blocks) — CONFIRMED, this is actually a resilient design already; REN-146's fix adds a time bound to each, it does not need to redesign the fallback coordination.

## Personalization interaction with P02
`priorityProductIds` (step 2 above) is the only integration point between this Epic's ranking and any personalization/recommendation logic. **UNKNOWN** where `priorityProductIds` is populated from (not traced in this pass — likely a P02-owned concern, e.g. a recently-viewed or recommended-products list passed in by the caller). This Epic does not change this integration point; flagging it as the one seam worth knowing about if P02 work ever touches ranking order.

## Merchandising interaction
None found (CONFIRMED absence) — P04 (merchandising/business rules) is not a formalized Epic (per `../../02-epics/EPIC_MAP.md`), and no promotion/pricing-rule engine is called from `getProducts()` beyond the plain discount-percent filter/sort above, which is a customer-facing filter, not merchandiser-configured promotion logic.

## Latency-relevant structure
See `04-architecture/DATA_FLOW.md` for the full sequential-vs-parallel breakdown. Summary: one already-parallel pair (`findMany` + `count`, REN-83), one confirmed-sequential pair that should be parallel (brand-embedding branch vs RAG fetch, REN-151), and one avoidable-cost-but-not-a-round-trip inefficiency (ILIKE predicate always evaluated, REN-158).
