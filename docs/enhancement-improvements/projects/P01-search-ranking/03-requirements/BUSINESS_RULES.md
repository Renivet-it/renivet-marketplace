# Business Rules — P01

Rules embedded in the current implementation (CONFIRMED via source), listed because they constrain any fix in this Epic — a fix must preserve these unless a rule is explicitly being changed by an issue.

| Rule | Where enforced | Must this Epic preserve it? |
|---|---|---|
| Exact brand-name match short-circuits search to that brand's products, skipping the external RAG call entirely. | `getProducts()`, exact-brand branch | Yes — REN-151 must not parallelize this branch away; it's already the fast path. |
| Fuzzy brand match only applies below a cosine-distance threshold of 0.28. | `getProducts()`, `BRAND_MATCH_THRESHOLD` | Yes — not in scope to tune. |
| RAG relevance ordering is suppressed whenever the customer picked an explicit sort (`sortBy` set). | `shouldApplySearchRelevanceOrdering()` | Yes — this is the SE-F002 fix; REN-158/151 changes must not regress it. Recommend a regression test explicitly re-asserting this (see `09-validation/TEST_STRATEGY.md`). |
| Best-seller and "new arrival" pins take priority over both brand match and RAG relevance in sort order. | `getProducts()` `orderBy` construction | Yes. |
| `requireMedia` excludes products whose resolved media has no valid URL, not just products with zero media rows. | `getProducts()` app-level filter | Yes — REN-155's fix must align the *count*, not remove this business rule. |
| Intent classification priority order: brand (highest) → intent-mapping table → category/subcategory/product-type name fallback → UNKNOWN. | `search-engine.ts` `processSearch()` | Yes — REN-149 only needs to *use* the result, not change this ordering. |
| A search with zero characters after trimming clears search-related URL params and shows the unfiltered catalog. | `product-search.tsx` `handleSearch` | Yes. |

**DECISION REQUIRED:** none of these rules are documented as intentional business policy anywhere outside the code itself (e.g. why 0.28, why best-sellers outrank brand match) — they are INFERRED to be intentional because they're specific, non-default values, not because a business document says so. Flag to a product owner before any refactor touches these thresholds.
