# Data Contracts — P02

## `getWardrobeSuggestions` output (confirmed shape, `cart.ts:891-921`)

```ts
{
  id: string;
  title: string;
  slug: string;
  price: number | null;
  compareAtPrice: number | null;
  brandId: string;
  brandName: string | null;
  categoryId: string;
  imageUrl: string | null;
  defaultVariantId: string | null;
  distance: number;   // 0 when sourced from external-model IDs (no distance computed); actual cosine distance only when sourced from the pgvector fallback branch
}[]
```
**Note (confirmed, minor contract inconsistency worth flagging, not a tracked defect):** `distance` is semantically meaningless (`0`) for the primary path's results and a real pgvector cosine distance for the fallback path's results — a consumer of this field (currently: none, it's not rendered in `wardrobe-suggestions.tsx`) cannot distinguish "genuinely zero distance" from "not computed." Not in scope to fix, noted for awareness given FR-1 adds a third source tier (independent DB fallback) that will also need a value in this field — recommend `null` for tiers where no similarity distance is computed, but this is an implementation detail, not a contract this package mandates changing.

## `getAdvancedRecommendations` external response (confirmed shape, per `product-recommendation.ts:16-17`)

```ts
// FastAPI response, per code comment:
[{ id: string, title: string, description: string, final_score: number, ... }]
```
**UNKNOWN full schema** — only the fields actually consumed downstream (`rec.id` in `cart.ts:766`) are verified; the rest is per the external service's own contract, not owned by this codebase. Any FR-1/FR-4 work must not assume fields beyond `id` are reliably present.

## `getPersonalizedRecommendations` output contract (confirmed, `recommendation.ts:43-57`)

```ts
interface RecommendationResult {
  products: ProductWithBrand[];  // rank-ordered, most-relevant-first
  source: "order_history" | "wishlist" | "browsing_history" | "search_history" | "platform_defaults" | "mixed";
  metadata?: { categoryId?: string; brandId?: string; productTypeId?: string };
}
```
**Contract implication for FR-2:** `products` is already documented (by its usage pattern, e.g. `.slice(0, limit)` after priority-ordered merging) as rank-ordered. FR-2's fix must preserve this contract — i.e., `getPersonalizedRecommendations` itself needs no signature or ordering change; only the downstream consumer (`getProducts`'s handling of `priorityProductIds`) needs to change to respect the order this contract already promises.

## Proposed cache-entry contract (FR-4, **DECISION REQUIRED** — not yet implemented)

```ts
// Placement A/B shared cache, keyed by productId
CacheEntry<AdvancedRecommendation[]> = {
  value: AdvancedRecommendation[];
  cachedAt: number;
  ttlSeconds: number;  // proposed 1-6 hours, see NON_FUNCTIONAL_REQUIREMENTS.md NFR-4
}

// Placement C cache, keyed by userId
CacheEntry<RecommendationResult> = {
  value: RecommendationResult;
  cachedAt: number;
  ttlSeconds: number;  // proposed 5-15 minutes
}
```
This is a proposed shape for implementation planning, not a ratified contract — final shape depends on whichever cache mechanism is chosen (Redis vs. `unstable_cache`, see `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md`).
