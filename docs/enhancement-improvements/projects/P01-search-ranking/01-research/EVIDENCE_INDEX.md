# Evidence Index — P01

All entries CONFIRMED by direct file read during this pass (2026-08-28/30) unless marked otherwise.

| # | Claim | File | Location | Status |
|---|---|---|---|---|
| 1 | `getProducts()` is the live catalog search/candidate-gen/ranking function | `src/lib/db/queries/product.ts` | method `getProducts`, ~L1044–1670 | CONFIRMED |
| 2 | Sequential external calls: embedding → brand-distance query → RAG fetch | `src/lib/db/queries/product.ts` | L1177 (`getEmbedding`), L1180 (`db.execute` brand distance), L1214 (`fetch` advanced-rag) | CONFIRMED |
| 3 | RAG fetch and brand-embedding branch are mutually independent | `src/lib/db/queries/product.ts` | L1177–1230 | CONFIRMED (RAG fetch uses `processedSearch` text only, no dependency on embedding/brand result) |
| 4 | ILIKE fallback OR'd into same WHERE clause as RAG `inArray`, even when RAG succeeded | `src/lib/db/queries/product.ts` | L1232–1274 | CONFIRMED |
| 5 | No indexed trigram/GIN support for the ILIKE columns today | `src/lib/db/schema/product.ts` | (absence — searched, none found) | CONFIRMED absence; consistent with REN-167 proposing pg_trgm as future work |
| 6 | `requireMedia` filter applied in SQL (`hasMedia`) at query time, then re-filtered in application code by resolved media URL *after* the `count()` query already ran | `src/lib/db/queries/product.ts` | SQL filter L1414; app-level re-filter L1638–1646; `count()` query L1583 | CONFIRMED |
| 7 | `requireMedia: true` is the default on every confirmed shop/catalog listing call site | `src/components/shop/storefront-catalog-page.tsx`, `src/components/shop/shop-products.tsx` | 5 call sites total | CONFIRMED |
| 8 | External ML service hardcoded to `http://64.227.137.174:8000`, no request timeout, dead `EMBEDDING_SERVICE_URL` fallback code | `src/lib/python/sematic-search.ts`, `ai-suggestion.ts`, `product-recommendation.ts`; `src/app/api/search/suggestions/route.ts` | all 5 files | CONFIRMED |
| 9 | `ai-suggestion.ts` (`fetchSuggestions`, `fetchSearchProducts`) has zero callers anywhere in `src/` | repo-wide grep | — | CONFIRMED (dead code, REN-156 target) |
| 10 | Live autosuggest calls `/api/search/suggestions` (REST), not the tRPC `search.getSuggestions` procedure | `src/components/ui/product-search.tsx` | ~L202 | CONFIRMED |
| 11 | `search-engine.ts`'s `getSuggestions()` export has zero callers from any component | repo-wide grep | — | CONFIRMED (dead, tracked as REN-107/XC-DEBT-001, not P01) |
| 12 | `search-engine.ts`'s `processSearch()` IS live, invoked via `trpc.general.search.processSearch` | `src/components/ui/product-search.tsx` | L384–396 | CONFIRMED |
| 13 | `onSuccess` discards `result.redirectUrl`, navigates using `result.originalQuery` instead | `src/components/ui/product-search.tsx` | L386–390 | CONFIRMED |
| 14 | `navigateToCatalogWithSearch` always clears `categoryId`/`subcategoryId`/`productTypeId` and pushes `?search=...` | `src/components/ui/product-search.tsx` | L295–310+ | CONFIRMED |
| 15 | `logSearchClick` tRPC mutation is a no-op stub (`// TODO: Implement click logging`) | `src/lib/trpc/routes/general/search.ts` | L60–73 | CONFIRMED |
| 16 | `products.embeddings`/`semanticSearchEmbeddings`/`searchSuggestionEmbeddings` written on product create/import, never read by `getProducts()` or any other confirmed query | `src/lib/db/schema/product.ts` (schema); `src/lib/trpc/routes/brands/products.ts` (writer) | schema L179–217; writer L667–1006 | CONFIRMED |
| 17 | `brands.embeddings` (384-dim) IS read live for brand-intent fuzzy matching | `src/lib/db/queries/product.ts` | L1180–1203 | CONFIRMED |
| 18 | Sort-by-price-overridden-by-RAG bug already fixed pre-audit | `src/lib/db/queries/product-ordering.ts` + `.test.ts` | commit `8b302953` | CONFIRMED via `git show` |
| 19 | `getProducts()` already parallelizes its main data query and count query (REN-83) | `src/lib/db/queries/product.ts` | L1558 `Promise.all` | CONFIRMED — distinct from, and non-overlapping with, REN-151's target |
| 20 | Redis (`mediaCache`) used for media hydration in `getProducts`, not for caching category-listing result sets | `src/lib/db/queries/product.ts` | L1602 (import from `@/lib/redis/methods`) | CONFIRMED usage exists; absence of listing-level cache is INFERRED from no cache-wrapper found around `getProducts` calls |
| 21 | `getEmbedding768` (768-dim E5 embedding) has no confirmed caller in `src/` | repo-wide grep | — | INFERRED dead/unused — not exhaustively traced to every call site given file size constraints; flag as UNKNOWN-leaning-unused rather than fully CONFIRMED dead |

## Not independently re-verified (accepted from prior pass, lower confidence)

- Exact count of "6+ call sites" for REN-146 in the original evidence summary — this pass confirms 5 distinct source files with the hardcoded-IP/no-timeout pattern, one of which (`ai-suggestion.ts`) is dead code. **DECISION REQUIRED-adjacent**: whether the timeout fix should still touch the dead file (arguably: no, remove it instead per REN-156) or only the 4 live call sites plus `product-recommendation.ts`.
