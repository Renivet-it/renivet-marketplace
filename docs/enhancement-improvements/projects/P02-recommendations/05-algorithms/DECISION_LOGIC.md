# Decision Logic — P02

## Placement A (cart cross-sell): primary/fallback decision tree — current vs. target

**Current (confirmed):**
```
try: for each of up to 3 cart items → getAdvancedRecommendations(itemId)  [external host]
if flattened+deduped IDs > 0:
    → hydrate from Postgres by ID, return
else:
    try: getEmbedding768(cartText) [SAME external host] → pgvector search
    if rows > 0: return rows
    else: return []
```
Decision weakness (REN-147): the `else` branch's precondition ("primary failed") does not imply "a different, more resilient path is now tried" — it implies "the same host is asked a different question."

**Target (FR-1):**
```
try: for each of up to 3 cart items → getAdvancedRecommendations(itemId)  [external host, cached per productId]
if IDs > 0: hydrate, return
else:
    try: getEmbedding768(cartText) [external host] → pgvector search
    if rows > 0: return rows
    else:
        → Postgres-only fallback: same-category-as-cart-items best-sellers → platform best-sellers  [NEW, independent of external host]
        if rows > 0: return rows
        else: return []  (genuine no-results, unchanged)
```
**DECISION REQUIRED:** whether to keep the same-host vector fallback as a middle tier (as sketched above) or remove it in favor of going straight from primary-failure to the new independent fallback. Keeping it costs one extra network round-trip in the failure case but preserves a genuinely different signal (embedding-based) when the host is degraded-but-not-fully-down (e.g., the recommendations endpoint errors but the embeddings endpoint doesn't). Removing it simplifies the code and guarantees faster failure recovery. This package does not mandate an answer — flagged for the implementing engineer/reviewer.

## Placement C (shop-page sort): rank-encoding decision — current vs. target

**Current (confirmed):** `priorityProductIds` → single `CASE WHEN id IN (list) THEN 0 ELSE 1 END`.

**Target (FR-2, per `TARGET_ALGORITHM.md` Option 1):**
```
priorityProductIds = [id_0, id_1, ..., id_n]  // already rank-ordered by getPersonalizedRecommendations
ORDER BY CASE products.id::text
    WHEN 'id_0' THEN 0
    WHEN 'id_1' THEN 1
    ...
    WHEN 'id_n' THEN n
    ELSE n + 1
END ASC
```
This is a mechanical change to how the existing, already-correct `priorityProductIds` array is consumed — no change to `getPersonalizedRecommendations` itself is required. Bounded by the existing `limit` parameter (default 20, max 50 per `getShopRecommendations`'s zod schema), so generated SQL size is bounded and known.

## Cross-placement decision: shared vs. per-surface caching for `getAdvancedRecommendations` (FR-4.2)

**DECISION REQUIRED (implementation detail, recommendation given):** cache by `productId` in a single shared cache namespace, not per-surface. Rationale: Placement A and B call the identical function with the identical parameter (`productId`) and would otherwise populate two redundant, identical cache entries for the same product if cached per-surface. A shared cache maximizes hit rate (a PDP view of product X warms the cache for a later cart-cross-sell computation involving X, and vice versa) at no correctness cost, since the underlying data (single-item similarity) does not depend on which surface is asking.

## Gating decision for REN-168 (not this package's call — documented for traceability)

```
IF demonstrated business need (see ../10-roadmap/VERSION_TRIGGERS.md) is met
   AND a scoping pass is separately commissioned
THEN design co-occurrence algorithm (not in this package)
ELSE remain deferred, no design work, no build
```
