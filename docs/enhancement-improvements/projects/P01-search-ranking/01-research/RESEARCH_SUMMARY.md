# Research Summary — P01

No dedicated research program exists for search (CONFIRMED — no `docs/research/search*` or similar directory found). All evidence comes from: (a) the ecommerce-intelligence audit that produced the `SE-F*`/`M-*`/`PF-*`/`AN-F002` findings referenced in `../../AUDIT_TO_BACKLOG_TRACEABILITY.md`, now corroborated by (b) direct source-code reading in this pass.

## Corrections this pass makes to the incoming evidence summary

1. **Two subsystems, not one.** The incoming summary describes "the search bar's intent-classification redirect" (REN-149) and "catalog search" (`getProducts`, REN-146/148/151/155/156/158/159) as if part of one pipeline. CONFIRMED: they are two independently-invoked code paths (`src/lib/search/search-engine.ts` vs `src/lib/db/queries/product.ts`) that never call each other. See `00-context/CURRENT_STATE.md`.
2. **pgvector is not uniformly unused.** CONFIRMED: `brands.embeddings` is read live (brand-intent fuzzy match inside `getProducts`); `products.embeddings`/`semanticSearchEmbeddings`/`searchSuggestionEmbeddings` are written but never read. The prior summary's "pgvector indexed but unused by live search" is correct only for the product-level columns.
3. **The ILIKE fallback is not a separate query.** REN-158 ("skip the unindexed ILIKE fallback query when RAG already returned candidates") is more precisely: the ILIKE/EXISTS-subquery predicate is OR'd into the *same* `WHERE` clause as the RAG `inArray(...)` predicate, so it is not an extra round-trip — it is unnecessary predicate-evaluation cost per row inside the one main query, on unindexed text columns. This changes the fix shape slightly (skip building the OR-branch, not "skip a query") — see `05-algorithms/CURRENT_ALGORITHM.md` and `03-requirements/FUNCTIONAL_REQUIREMENTS.md`.
4. **REN-151's parallelization target identified precisely.** CONFIRMED sequential chain: `getEmbedding()` → brand-distance query (depends on the embedding) → RAG `fetch()` (independent of both). The RAG fetch and the brand-embedding-plus-match pair are mutually independent and safe to run via `Promise.all`; this is distinct from and does not overlap the `Promise.all([findMany, count])` REN-83 already shipped.
5. **A third dead-code path exists beyond REN-156's stated scope.** `getSuggestions()` in `search-engine.ts` is unused (the live autosuggest path is `api/search/suggestions/route.ts`, calling the external service directly) but is tracked separately as REN-107 under `XC-DEBT-001`, not under this Epic. Documented here for completeness; not claimed as P01 scope.
6. **REN-146's "hardcoded IP" claim confirmed for all 5 call sites**, including one (`ai-suggestion.ts`) that is itself dead code — meaning the effective in-scope timeout fix touches 4 live call sites plus `product-recommendation.ts` (shared with P02), not 6+ as loosely stated; exact count in `01-research/EVIDENCE_INDEX.md`.
7. **`requireMedia: true` is the default, not an edge case**, on every confirmed shop/catalog listing entry point — raises REN-155's practical severity from cosmetic to "affects most page loads."

## What was not found

- No load-test, latency benchmark, or APM/observability data for search anywhere in the repo — see `08-reliability/PERFORMANCE.md`.
- No architecture decision record (ADR) for the external ML/search microservice's original adoption.
- No data-science/ML-owner documentation — see `07-feasibility/RESOURCE_ASSESSMENT.md`.
