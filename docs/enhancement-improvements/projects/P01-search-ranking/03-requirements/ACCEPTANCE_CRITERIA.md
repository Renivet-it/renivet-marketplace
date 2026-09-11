# Acceptance Criteria — P01

Written per issue, Given/When/Then. These are definitions of "done," not implementations.

## REN-146 — Timeouts + endpoint config
- Given the external ML/search microservice is unreachable or hangs, when any of the 4 live call sites (embeddings, RAG search, recommendations, suggestions) is invoked, then the call must fail within the configured timeout and the caller must proceed on its existing fallback (ILIKE, empty suggestion list, empty recommendation list) rather than hang past that bound.
- Given the base URL is now environment-driven, when `EMBEDDING_SERVICE_URL` (or its replacement) is unset, then the system must use a documented default rather than silently falling through to a hardcoded literal buried in commented-out code.

## REN-149 — Reconnect redirect
- Given a search query that exactly matches a brand name, when the customer submits the search, then they land on `/brands/{slug}` (or the currently-defined equivalent), not `/shop?search=...`.
- Given a search query with `UNKNOWN` intent, when submitted, then behavior is unchanged from today (generic catalog search).

## REN-151 — Parallelize
- Given a free-text search that triggers both the brand-embedding branch and the RAG fetch, when `getProducts()` executes, then both branches are in flight concurrently, and total added latency from this pair is no more than the slower of the two (not their sum).
- Given either branch fails, then the other's result is still used and the overall search still returns results (no new failure mode introduced by parallelizing).

## REN-154 — Click/result-count logging
- Given a customer clicks a product from a search result, when `logSearchClick` fires, then a persisted record exists linking the search to the clicked product.
- Given a search executes, when results are returned, then the result count is recorded against that search's analytics row.

## REN-155 — Result count consistency
- Given `requireMedia` is set and some returned rows lack a valid media URL, when the response is built, then the `count` field equals `data.length`'s true total across pages, not the pre-filter SQL count.

## REN-156 — Dead code removal
- Given `ai-suggestion.ts` is deleted, when the app builds and the suggestions/search flows are exercised, then no behavior changes (confirms it was truly unused).

## REN-158 — Skip redundant ILIKE
- Given RAG returns 1+ candidate IDs, when the WHERE clause is built, then no ILIKE/EXISTS-subquery predicate is included.
- Given RAG returns 0 candidates or fails, when the WHERE clause is built, then the ILIKE fallback is included exactly as today (no regression to the actual fallback case).

## REN-159 — Category listing cache
- Given two identical category-only (no free-text search) requests within the cache TTL, when the second request is made, then it is served without re-executing the full `getProducts()` DB query path.
- Given the underlying catalog changes (e.g. a product is unpublished), then the cache must not serve stale data past its TTL — no requirement for immediate invalidation unless a product owner decides otherwise (DECISION REQUIRED, see `10-roadmap/V1.md`).

## REN-148 — Staged sync-cadence step
- Given this issue's staged scope, when complete, then a documented cadence/confirmation mechanism exists — full automated reconciliation is explicitly NOT an acceptance criterion here.

## SE-F002 regression (no ticket, recommended)
- Given a search with an explicit `sortBy=price`, when results return, then they are ordered strictly by price, never by RAG relevance order — already covered by `product-ordering.test.ts`; recommend keeping this test in the regression suite for every issue in this Epic that touches `getProducts()`'s ordering logic.
