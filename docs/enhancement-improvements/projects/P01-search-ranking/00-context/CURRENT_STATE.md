# Current State — Search & Ranking (CONFIRMED via source read, 2026-08-28/30)

## The two independent search subsystems

Renivet actually has **two separate, independently-triggered search mechanisms** sharing the name "search." The prior portfolio summary described one; the code has two. This is the single most important correction this pass makes.

### Subsystem A — Catalog candidate retrieval & ranking (`getProducts()`)
`src/lib/db/queries/product.ts`, method `getProducts()` (~line 1044–1670 of a 6,422-line file). This is what actually returns the product list shown on `/shop`. CONFIRMED flow when a `search` string is supplied:

1. Trim/normalize the query (`preprocessSearchQuery`, `src/lib/python/sematic-search.ts`).
2. Exact-brand-name lookup in Postgres (`brands.name` case-insensitive equality). If matched, search short-circuits to `eq(products.brandId, ...)` — no external call.
3. Otherwise: generate a 384-dim embedding of the query via the external ML microservice (`getEmbedding`), then query `brands.embeddings` (pgvector, `<=>` cosine distance) for a fuzzy brand match (threshold 0.28).
4. Separately, call the external RAG endpoint `GET /search/advanced-rag` (limit 150) for ranked product-ID candidates.
5. Build a Postgres `ILIKE` OR-clause (title/description/metaTitle/metaDescription + brand/category/subcategory/product-type name `EXISTS` subqueries) as a fallback predicate.
6. Final WHERE clause: `inArray(ragProductIds) OR ilikeFallback` when RAG returned candidates; `ilikeFallback` alone otherwise.
7. Apply all other filters (price, active/available/published, color/size options, discount, `requireMedia`, collections) and build an `ORDER BY` (best-seller/new-arrival pins → priority products → brand match → RAG relevance order via `CASE id WHEN ...` → discount % → user-selected sort).
8. Run the main `findMany` + a `count()` query in `Promise.all` (CONFIRMED — one parallelization already exists here, from REN-83).
9. Hydrate media via Redis (`mediaCache`), then **re-filter the result set** for products whose media actually resolved to a valid URL, when `requireMedia` was requested — this happens *after* step 8's `count()` was already computed.

### Subsystem B — Deterministic intent classification (`search-engine.ts`)
`src/lib/search/search-engine.ts`, exposed via `src/lib/trpc/routes/general/search.ts`. Purely rule-based, no external ML call, no embeddings. CONFIRMED flow when the search bar's Enter/submit fires:

1. `normalizeQuery` → strip noise chars, lowercase, collapse whitespace.
2. `detectBrandIntent` — exact name/slug, DB alias table, then substring partial match (highest priority).
3. `detectIntentFromMapping` — exact/partial match against a `search_intents` keyword table.
4. `detectCategoryIntentFallback` — direct name matching against product types → subcategories → categories, most specific first.
5. Returns an `IntentType` (`BRAND` / `CATEGORY` / `SUBCATEGORY` / `PRODUCT_TYPE` / `UNKNOWN`) plus a computed `redirectUrl` (e.g. `/brands/{slug}` for a brand match) and `uiCopy`.
6. `logSearchQuery` writes the result to a `searchAnalytics` table (this part works).
7. A separate `getSuggestions()` export in the same file generates Myntra-style autocomplete suggestions purely from DB category/brand/intent data — **CONFIRMED dead code**, not called from any component (the live autosuggest path is Subsystem C below). This is tracked as REN-107/XC-DEBT-001, not part of this Epic's ten issues — noted here only because it lives in the same file as the live intent classifier and could be mistaken for part of it.

**The bug (REN-149):** `src/components/ui/product-search.tsx` lines 384–396 call this mutation, but `onSuccess` ignores the returned `redirectUrl` entirely and calls `navigateToCatalogWithSearch(result.originalQuery)` — which always routes to `/shop?search=...` and explicitly clears `categoryId`/`subcategoryId`/`productTypeId` params. The entire brand/category classification in step 2–5 is computed, logged, and then thrown away on every single search. CONFIRMED by reading both files.

### Subsystem C — Autosuggest-as-you-type
`src/app/api/search/suggestions/route.ts`, a REST route (not tRPC) that proxies to the external microservice's `GET /suggestions/ai-suggestions`. This is what the search bar actually calls while typing (`product-search.tsx` line ~202), not Subsystem B's `getSuggestions()`. It forwards the browser's `AbortSignal` (`request.signal`) so a client-side cancel propagates, but sets no independent server-side timeout of its own.

## The external ML/search microservice

One shared, third-party-style dependency, called from (CONFIRMED, all under `src/lib/python/` plus the two routes above):
- `sematic-search.ts` — `getEmbedding` (384-dim), `getEmbedding768` (768-dim, unused by any confirmed caller — see `01-research/EVIDENCE_INDEX.md`).
- `ai-suggestion.ts` — `fetchSuggestions`, `fetchSearchProducts` — **dead code**, zero callers found anywhere in `src/` (REN-156 target).
- `product-recommendation.ts` — `getAdvancedRecommendations` (shared with P02).
- `product.ts`'s inline `fetch` to `/search/advanced-rag` (the live RAG call in Subsystem A).
- `api/search/suggestions/route.ts` (Subsystem C).

Every one of these hits the literal string `http://64.227.137.174:8000` — CONFIRMED hardcoded, non-TLS IP literal, present even alongside commented-out `process.env.EMBEDDING_SERVICE_URL ||` fallback code that is never actually used (the interpolation always resolves to the hardcoded literal, not the env var). **None of these five call sites sets a request timeout** — no `axios` `timeout` option, no `AbortSignal.timeout()`. This is REN-146's exact scope.

## pgvector: indexed, partially used

`products.embeddings`, `products.searchSuggestionEmbeddings`, `products.semanticSearchEmbeddings` (all `vector`, ivfflat-indexed, `src/lib/db/schema/product.ts`) are **written** when a brand creates/imports a product (`src/lib/trpc/routes/brands/products.ts`) but **CONFIRMED never read** by `getProducts()` or anywhere else in `src/` — live product search goes entirely through the external RAG endpoint, not a local pgvector similarity query. `brands.embeddings` (384-dim) **is** read live, for the brand-intent fuzzy-match step in Subsystem A. This corrects the prior summary's blanket "pgvector indexed but unused" — it's unused for *products*, but actively used for *brand* matching.

## What already shipped (do not re-litigate)

- **REN-83** (Done) — the `Promise.all([findMany, count])` in step 8 above.
- **SE-F002 / sort-by-price-overridden-by-RAG bug** — resolved pre-audit in commit `8b302953`, via a new `shouldApplySearchRelevanceOrdering()` guard (`src/lib/db/queries/product-ordering.ts`) that suppresses RAG relevance ordering whenever the customer picked an explicit sort. Has a regression test already (`product-ordering.test.ts`) — CONFIRMED both files exist and the guard logic is `isRagSearchActive && hasRagResults && !sortBy`.

## requireMedia default (REN-155 real-world blast radius)

`requireMedia: true` is passed on **every confirmed customer-facing shop/catalog listing call** (`storefront-catalog-page.tsx` ×4, `shop-products.tsx` ×1) — this is not an edge case, it is the default listing behavior. The count-vs-filtered-data mismatch described in step 9 above therefore affects most catalog page loads, not a rare path.
