# Evidence Index — P02

Each entry: claim, classification, exact source location, and what it proves.

## #1 — REN-147: fallback shares fate with primary, plus dead config

**CONFIRMED**

- `src/lib/python/product-recommendation.ts:5-10`:
  ```ts
  const baseUrl = process.env.EMBEDDING_SERVICE_URL || "http://localhost:8000";
  ...
  const response = await axios.get(
      `${"http://64.227.137.174:8000"}/recommendations/similar-advanced`,
      { params: { product_id: productId, top_n: 28 } }
  );
  ```
  `baseUrl` is computed and never used. The literal template string `${"http://64.227.137.174:8000"}` is a hardcoded constant dressed up to look configurable.
- `src/lib/python/sematic-search.ts:33-40` (`getEmbedding768`, the function invoked by `getWardrobeSuggestions`'s fallback branch):
  ```ts
  const response = await axios.post(
      `${"http://64.227.137.174:8000"}/embeddings/generate-768`,
      { text }, { headers: { "Content-Type": "application/json" } }
  );
  ```
  Identical host and port as #1's primary call, different path.
- `src/lib/trpc/routes/general/cart.ts:748-757` (primary) and `:809-864` (fallback branch, entered only `if (targetIds.length === 0)`) — confirms `getWardrobeSuggestions` structurally treats these as primary/fallback, and both terminate at `64.227.137.174:8000`.

**Proves:** REN-147's claim is accurate and slightly understated by the prior summary — there is no environment-based override available even if one were configured, because the code path that would read it is unreachable.

## #2 — REN-150: binary bucket, comment contradicts implementation

**CONFIRMED**

`src/lib/db/queries/product.ts:1445-1453`:
```ts
// 🎯 Step -1: prioritize user's personalized products (highest priority)
if (priorityProductIds && priorityProductIds.length > 0) {
    // Create a CASE statement that gives lower values to priority products
    // Products in the priority list get sorted by their position in the list
    orderBy.push(
        sql`CASE WHEN ${products.id}::text IN (${sql.raw(priorityProductIds.map((id) => `'${id}'`).join(", "))}) 
            THEN 0 ELSE 1 END ASC`
    );
}
```
The comment ("sorted by their position in the list") describes a `CASE id WHEN x THEN 0 WHEN y THEN 1 WHEN z THEN 2 ... END`-style construct. The actual SQL is a single `IN (...)` membership test producing exactly two buckets (0 or 1). Caller: `src/components/shop/storefront-catalog-page.tsx:584-599`, which passes `recommendations.products.map(p => p.id)` — an already-ranked array — as `priorityProductIds`, confirming the rank information exists at the call site and is discarded inside `getProducts`.

**Proves:** REN-150 exactly as described; additionally shows the loss happens at the SQL-generation boundary, not because the upstream ranking is itself missing.

## #3 — REN-157: identical single-item function on both surfaces

**CONFIRMED**

- Cart: `src/lib/trpc/routes/general/cart.ts:749` — `getAdvancedRecommendations(item.productId)`, called once per cart item (up to 3).
- PDP: `src/lib/trpc/routes/brands/products.ts:1966-1987` (`getRecommendations` procedure) — `getAdvancedRecommendations(input.productId)`, called once for the viewed product.
- Both import from the same module: `src/lib/python/product-recommendation.ts`, same exported function, same signature, same external endpoint (`/recommendations/similar-advanced`).

**Proves:** No basket-, cart-composition-, or complementary-item logic distinguishes the two surfaces — they are the same underlying capability presented with different copy and layout. Directly supports REN-157's premise for the copy fix.

## #4 — REN-160: no caching anywhere in the computation path

**CONFIRMED (absence)**

Grepped `Cache`/`cache` usage across the recommendation-adjacent files:
- `src/lib/db/queries/recommendation.ts` — imports `mediaCache` only (for enriching product media URLs after computation, not for caching the computation/ranking itself).
- `src/lib/trpc/routes/general/cart.ts` — `getWardrobeSuggestions` uses no cache; `userCartCache`/`userWishlistCache`/`mediaCache` are used elsewhere in the file for cart/wishlist state and media, not for recommendation results.
- `src/components/shop/storefront-catalog-page.tsx:424-460` — `getCachedDefaultProducts`/`getCachedNewArrivalProducts` wrap `next/cache`'s `unstable_cache` around **non-personalized** default/new-arrivals listing queries only; the personalized branch (`shouldUseRecommendations`, line 576) calls `recommendationQueries.getPersonalizedRecommendations` directly with no cache wrapper (line 578).

**Proves:** REN-160 as described. The caching infrastructure pattern (`unstable_cache`) already exists and is used adjacent to this exact code path — the fix is a known, low-novelty pattern to extend, not new infrastructure (see `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md`).

## #5 — NEW: PDP's independent fallback chain (not in prior summary)

**CONFIRMED**

`src/components/products/product/product-recommendation.tsx:146-312` (`YouMayAlsoLike`):
- Primary: `trpc.brands.products.getRecommendations` (→ `getAdvancedRecommendations`, external ML host).
- `shouldLoadSameBrand` (line 176): true when primary resolved with zero usable products → queries `trpc.brands.products.getProducts` filtered to `brandIds: [brandId]`, `sortBy: "best-sellers"` — a plain Postgres query, no external ML call.
- `shouldLoadSameCategory` (line 212): triggers if same-brand also empty → `getProducts` filtered by `categoryId`.
- `shouldLoadBestSellers` (line 250): triggers if same-category also empty → `getProducts` with no filters, best-sellers sort.
- `finalProducts` (line 287): merges and dedupes across all four sources, capped at 8.

**Proves:** a genuinely host-independent, multi-tier fallback pattern already exists in this codebase, on the *sibling* surface to the one with the defect (cart). This is the strongest evidence for how to scope REN-147's fix cheaply (reuse/port, not invent).
