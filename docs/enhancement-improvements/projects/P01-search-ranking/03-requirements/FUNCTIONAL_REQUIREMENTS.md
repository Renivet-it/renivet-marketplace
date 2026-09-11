# Functional Requirements — P01

Each requirement maps to exactly one backlog issue and states current vs. required behavior. All "Current" rows are CONFIRMED via source read (see `01-research/EVIDENCE_INDEX.md` for exact locations).

## FR-1 (REN-146) — Bounded external-call latency
- **Current:** All 5 call sites to the external ML/search microservice (`getEmbedding`, `getEmbedding768`, `fetchSuggestions`/`fetchSearchProducts` [dead], `getAdvancedRecommendations`, the RAG `fetch` in `getProducts`, and the suggestions REST route) have no request timeout.
- **Required:** Every live call site must set an explicit timeout (e.g. `axios` `timeout` option or `AbortSignal.timeout()`) with a defined ceiling, and must fail into the existing fallback path (ILIKE for search, empty array for recommendations/suggestions) rather than hang.
- **Required:** The hardcoded IP literal and dead `EMBEDDING_SERVICE_URL`-fallback comment code must be replaced with a single real environment-variable-driven base URL (or the dead conditional code removed if the literal is intentionally pinned) — this is an endpoint-configuration correctness fix, not a networking redesign.

## FR-2 (REN-149) — Reconnect intent-classification redirect
- **Current:** `processSearchMutation`'s `onSuccess` in `product-search.tsx` discards `result.redirectUrl` and always navigates via `navigateToCatalogWithSearch(result.originalQuery)`.
- **Required:** `onSuccess` must route using `result.redirectUrl` (and associated `categoryId`/`subcategoryId`/`productTypeId`/brand-slug params) when `intentType !== "UNKNOWN"`, falling back to the current generic catalog-search navigation only for `UNKNOWN` intent.

## FR-3 (REN-151) — Parallelize independent external calls
- **Current:** In `getProducts()`, the brand-embedding-and-match branch and the RAG `fetch` branch run sequentially despite having no data dependency between them.
- **Required:** Both branches must run concurrently (e.g. `Promise.all`), preserving existing error handling (each branch already independently catches and degrades — this must not change).

## FR-4 (REN-154) — Real search click/result-count logging
- **Current:** `logSearchClick` in `search.ts` is a no-op stub; result counts are not persisted anywhere per search.
- **Required:** `logSearchClick` must persist the click event (searchId/productId at minimum) against the corresponding `searchAnalytics` row; `getProducts`/the search flow must record the returned result count per search so search-quality metrics become computable.

## FR-5 (REN-155) — Consistent result counts under `requireMedia`
- **Current:** `count()` is computed from the SQL `hasMedia` predicate before the application-level valid-URL re-filter runs, so `count` can exceed `data.length` after filtering.
- **Required:** The count returned to the client must reflect the same media-validity criteria actually applied to `data`, for any request where `requireMedia` is set.

## FR-6 (REN-156) — Remove dead RAG client code
- **Current:** `ai-suggestion.ts` (`fetchSuggestions`, `fetchSearchProducts`) has zero callers.
- **Required:** Delete the file (or its unused exports) so it cannot be mistakenly wired up as a second, redundant call path to the same RAG endpoint `getProducts()` already calls.

## FR-7 (REN-158) — Skip redundant ILIKE predicate when RAG already succeeded
- **Current:** The ILIKE/EXISTS-subquery OR-branch is always built and included in the WHERE clause whenever a search string is present, even when `ragProductIds.length > 0`.
- **Required:** When RAG returns candidates, the WHERE clause should use `inArray(ragProductIds)` alone (or a narrowly-scoped fallback), omitting the unindexed ILIKE/EXISTS branches, which should only be built when RAG returns zero candidates or fails.

## FR-8 (REN-159) — Cache category-only and category+sort listing views
- **Current:** No caching layer wraps `getProducts()` results for the common "browse a category" (no free-text search) case.
- **Required:** Category-only and category+sort listing responses (no `search` term, no personalized `priorityProductIds`) should be served from a short-TTL cache (Redis, consistent with the existing `mediaCache` pattern) keyed on the filter/sort combination.

## FR-9 (REN-148) — Staged first step toward index-drift visibility
- **Current:** No mechanism confirms or bounds how far the external search index can drift from the live Postgres catalog.
- **Required (staged, per portfolio scope):** Define and schedule a sync-cadence confirmation step only — this requirement explicitly excludes building a full reconciliation pipeline. See `07-feasibility/ALTERNATIVES.md`.

## FR-10 (REN-167, deferred) — Typo-tolerant fallback
- **Current:** No typo tolerance exists in the ILIKE fallback.
- **Required:** Not required now. Gated on fallback-activation-rate data that REN-146, once shipped, would produce. Do not build.
