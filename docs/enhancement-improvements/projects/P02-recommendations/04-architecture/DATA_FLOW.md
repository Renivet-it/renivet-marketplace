# Data Flow — P02

## Flow 1: Cart cross-sell (current, confirmed)

1. Shopper loads `/mycart` with ≥1 cart item.
2. `WardrobeSuggestions` fires `trpc...getWardrobeSuggestions.useQuery({ userId })`, gated on cart being non-empty (`wardrobe-suggestions.tsx:24-30`).
3. Server: reads cart from `userCartCache` (Redis), takes first 3 items (`cart.ts:740-745`).
4. Parallel HTTP calls to `getAdvancedRecommendations(productId)` per item → external ML host `/recommendations/similar-advanced`. Per-item errors caught individually, treated as `[]`.
5. Results flattened, deduped, capped at 8 IDs, excluding anything already in cart.
6. **If IDs found:** direct Postgres query hydrates full product rows for those IDs.
7. **If zero IDs found (all calls failed or empty):** fallback branch — build text from cart titles/brands → `getEmbedding768` (same ML host, different endpoint) → pgvector cosine-similarity query, excluding cart product IDs, limit 8. **This step is where REN-147 manifests**: if the ML host itself is down, step 4 already failed for every item, and step 7 will also fail (same host), so the fallback provides zero incremental resilience.
8. Media hydration via `mediaCache` (Redis).
9. Response shaped and returned to frontend; empty array → component renders nothing.

## Flow 2: PDP similar products (current, confirmed)

1. Shopper loads a product page; `YouMayAlsoLike` fires `getRecommendations` with the viewed product's ID.
2. Server: single call to `getAdvancedRecommendations(productId)` (same function as Flow 1 step 4) → external ML host.
3. **If results:** frontend filters out the viewed product itself, uses as `finalProducts` (capped at 8).
4. **If empty** (ML host down or genuinely no similar items): frontend sequentially enables same-brand → same-category → platform-bestsellers `getProducts` queries (Postgres only), merging/deduping results across whichever tiers actually ran, capped at 8. This chain is genuinely independent of the ML host — it is the working fallback pattern absent from Flow 1.

## Flow 3: Shop-page personalized sort (current, confirmed)

1. Signed-in shopper loads `/shop` with no filters, page 1, default sort.
2. `shouldUseRecommendations` gate passes (`storefront-catalog-page.tsx:560-572`).
3. `recommendationQueries.getPersonalizedRecommendations({ userId, limit, excludeProductIds: [] })`:
   a. Check `userHasOrders` (Postgres) → if true, order-based branch (category/brand/type match ordering, Postgres only).
   b. If no orders, merged branch: `Promise.allSettled` over browsing-history, wishlist, search-history sub-queries (all Postgres, all time-windowed), combined by priority order, backfilled with platform defaults if <5 results.
4. Result: an ordered array of product objects (`RecommendationResult.products`), already ranked by the logic in step 3.
5. Their IDs are extracted (`recommendations.products.map(p => p.id)`) and passed as `priorityProductIds` into `productQueries.getProducts`.
6. **REN-150 manifests here:** `getProducts` converts `priorityProductIds` into a binary `IN (...)` bucket — the rank computed in steps 3-4 is discarded; only membership survives into the final `ORDER BY`.
7. Final product list rendered to shopper, ordered by: personalization-bucket (0/1) → best-seller flag (if `prioritizeBestSellers`) → other tie-breakers — **not** by the personalization strength computed upstream.

## Flow 4 (target, FR-4/REN-160 — not yet built)

Proposed insertion points for caching, without altering the flows above structurally:
- Flow 1: cache keyed by `productId` around `getAdvancedRecommendations` (benefits Flow 1 and Flow 2 simultaneously, since both call it).
- Flow 3: cache keyed by `userId` around the full `getPersonalizedRecommendations` call (step 3 above), invalidated by TTL only (no event-driven invalidation required per FR-4.3).

This is a requirements-level insertion point, not a finalized design — see `05-algorithms/TARGET_ALGORITHM.md` and `07-feasibility/FEASIBILITY_ASSESSMENT.md` for tradeoffs.
