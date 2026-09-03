# Current State — P02 Recommendations & Personalization

All items in this file are **CONFIRMED** by direct source reading during this pass unless marked otherwise. File paths are relative to the repo root `renivet-marketplace/`.

## Surface 1: Cart cross-sell ("wardrobe suggestions")

- Component: `src/app/(protected)/mycart/Component/wardrobe-suggestions.tsx`. Renders only when the cart is non-empty and `getWardrobeSuggestions` returns ≥1 item; renders nothing on empty/loading-failed state (no error UI, no generic fallback message).
- Backend: `getWardrobeSuggestions` in `src/lib/trpc/routes/general/cart.ts:728-926`.
  - Takes the shopper's first 3 cart items.
  - **Primary path:** calls `getAdvancedRecommendations(productId)` per item, in parallel, against `http://64.227.137.174:8000/recommendations/similar-advanced` (`src/lib/python/product-recommendation.ts:3-24`). Per-item failures are individually caught and treated as empty (`.catch(() => [])`), so a partial outage degrades gracefully at the item level.
  - Result IDs are deduped, capped at 8, and used to fetch full product rows directly from Postgres.
  - **"Fallback" path** (only triggered when the primary path yields zero IDs — i.e., all `getAdvancedRecommendations` calls failed or all returned nothing usable): builds a text blob from cart product titles/brands, calls `getEmbedding768(searchText)` against `http://64.227.137.174:8000/embeddings/generate-768` (`src/lib/python/sematic-search.ts:33-57`), then does a pgvector cosine-similarity query.
  - **Confirmed defect (REN-147):** both paths target the identical host and port, `64.227.137.174:8000`, hardcoded as a string literal. `getAdvancedRecommendations` computes an `EMBEDDING_SERVICE_URL`-based `baseUrl` (`product-recommendation.ts:5-6`) but never uses it — the request URL is a separate hardcoded literal (line 10). A total outage of that one host fails both the primary and "fallback" call, and the entire panel silently disappears from the cart page.
  - No caching of results (see PF-F006/REN-160 below).

## Surface 2: PDP "similar products" ("You May Like")

- Component: `src/components/products/product/product-recommendation.tsx` (exported as `YouMayAlsoLike`).
- Backend for primary signal: `getRecommendations` tRPC procedure, `src/lib/trpc/routes/brands/products.ts:1966-1987` — calls the **same** `getAdvancedRecommendations(productId)` function used by cart cross-sell, for the single product being viewed.
- **Confirmed (REN-157):** cart cross-sell and PDP similar-products are backed by the identical single-item external similarity call. No basket-, co-occurrence-, or complementary-item logic exists on either surface.
- **Frontend fallback chain (not present on the cart surface — a real architectural asymmetry):** if the primary call returns no usable products, the component progressively queries, via separate tRPC calls into `getProducts` (Postgres, not the external ML host): same-brand best-sellers → same-category best-sellers → platform-wide best-sellers (`product-recommendation.tsx:176-286`). This fallback chain is genuinely independent of the external ML host and does not exhibit REN-147's failure mode. This is a positive, reusable pattern the cart surface's fix should likely mirror (see `04-architecture/INTEGRATIONS.md` and `08-reliability/FAILURE_MATRIX.md`).
- No caching of the primary recommendation call.

## Surface 3: Shop-page "Recommended" default sort

- Server logic: `src/components/shop/storefront-catalog-page.tsx:560-676`.
- Triggers only for a signed-in shopper, on page 1, with no search/filter/category/brand/price constraints active, and `defaultSortBy === "recommended"` (the default).
- Calls `recommendationQueries.getPersonalizedRecommendations` (`src/lib/db/queries/recommendation.ts`), a DB-only (no external ML call) cascading scorer:
  - Shoppers with orders in the last 90 days → same-category/brand/product-type products, ordered by match-then-bestseller-then-recency.
  - Shoppers without orders → merged strategy: browsing history (7-day weighted event score: add_to_cart=5, purchase=4, click=2, view=1) + wishlist (30-day) + search history (14-day), combined and deduped, falling back to platform defaults (best-sellers/newest) if fewer than 5 results.
  - No signed-in user or any exception → platform defaults.
- **Confirmed defect (REN-150):** the ranked list this function produces is passed to `productQueries.getProducts` as `priorityProductIds`, but the actual SQL ordering clause is a binary bucket: `CASE WHEN products.id::text IN (...) THEN 0 ELSE 1 END ASC` (`src/lib/db/queries/product.ts:1446-1453`). The code comment directly above this line claims "Products in the priority list get sorted by their position in the list" — the comment is inaccurate; the implementation does not do this. All personalized-list members are ordered equally (bucket 0), with all other products in bucket 1; within each bucket, subsequent `ORDER BY` clauses (best-seller flag, recency, etc.) determine order, not personalization rank.
- No caching of `getPersonalizedRecommendations`'s output; only the *non-personalized* fallback queries (`getCachedDefaultProducts`, `getCachedNewArrivalProducts`, `storefront-catalog-page.tsx:424-460`, wrapped in `next/cache`'s `unstable_cache`) are cached.

## Cross-cutting: caching (REN-160 / PF-F006)

- **Confirmed:** none of `getAdvancedRecommendations`, `getEmbedding768`, `getWardrobeSuggestions`, or `getPersonalizedRecommendations` (nor any of its four sub-strategies) are wrapped in any cache layer (no Redis, no `unstable_cache`, no in-memory memoization).
- Every page load of a cart with items, a PDP, or a personalized shop-page view re-runs the full computation, including external HTTP calls to the ML service and/or up to 4 parallel DB sub-queries with dynamic SQL.

## Not present in the codebase (confirmed absent)

- No basket-level co-occurrence/"frequently bought together" table, job, or query (REN-168 territory).
- No post-purchase/order-confirmation recommendation component or route (REN-165 territory).
- No recommendation-specific analytics/metrics dashboard or event schema distinct from generic PostHog/brand-events tracking already used for cart/wishlist actions.
- No admin/merchandiser override or curation layer for any of the three surfaces.

## Adjacent, out-of-scope-but-relevant surface (context only)

- `src/app/(protected)/mycart/Component/empty-cart-recommendations.tsx`: shown on an *empty* cart, offers `STATIC_FALLBACK_PRODUCTS` — four hardcoded links to shop-page filter presets (no personalization, no ML call). Distinct from RE-F008 (recently-viewed) and REN-165 (post-purchase); mentioned here only because it's another place "recommendation"-shaped UI exists with zero backing logic. Not tracked as a defect (fully static by design, no copy overclaims AI/personalization).
