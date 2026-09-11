# Component Architecture — P02

All confirmed via source reading, current state only (no target-state redesign proposed — see `SYSTEM_ARCHITECTURE.md`'s target-state note).

## Frontend components

| Component | Path | Surface | Data source |
|---|---|---|---|
| `WardrobeSuggestions` | `src/app/(protected)/mycart/Component/wardrobe-suggestions.tsx` | Cart cross-sell | `trpc.general.users.cart.getWardrobeSuggestions` |
| `YouMayAlsoLike` | `src/components/products/product/product-recommendation.tsx` | PDP similar products | `trpc.brands.products.getRecommendations` + 3-tier `getProducts` fallback |
| Shop sort (server component logic) | `src/components/shop/storefront-catalog-page.tsx` | Shop-page "Recommended" default sort | `recommendationQueries.getPersonalizedRecommendations` + `productQueries.getProducts` |
| `EmptyCartRecommendations` (context only, not in Epic scope) | `src/app/(protected)/mycart/Component/empty-cart-recommendations.tsx` | Empty-cart state | Fully static, no query |

## Backend / data-layer components

| Component | Path | Role |
|---|---|---|
| `getWardrobeSuggestions` (tRPC procedure) | `src/lib/trpc/routes/general/cart.ts:728-926` | Orchestrates cart cross-sell: primary ML calls, fallback vector search, product hydration |
| `getRecommendations` (tRPC procedure) | `src/lib/trpc/routes/brands/products.ts:1966-1987` | Thin wrapper around `getAdvancedRecommendations` for PDP |
| `getShopRecommendations` (tRPC procedure) | `src/lib/trpc/routes/brands/products.ts:1993-2012` | Thin wrapper around `recommendationQueries.getPersonalizedRecommendations` — **note:** this procedure exists but `storefront-catalog-page.tsx` calls `recommendationQueries` directly server-side rather than through this tRPC procedure (confirmed at line 578); the procedure appears to be for client-side/other consumers, not the shop page's own SSR path |
| `getAdvancedRecommendations` | `src/lib/python/product-recommendation.ts` | Single external HTTP call, shared by cart + PDP |
| `getEmbedding768` / `getEmbedding` | `src/lib/python/sematic-search.ts` | Embedding generation, used by cart's fallback and (per P01 scope) search |
| `RecommendationQuery` class (`recommendationQueries` singleton) | `src/lib/db/queries/recommendation.ts` | Postgres-only multi-signal scorer for shop-page personalization |
| `getProducts` (`priorityProductIds` param) | `src/lib/db/queries/product.ts` | General product listing/search; REN-150's defect lives in its ordering logic |

## Component-level observations relevant to this Epic's fixes

- `getWardrobeSuggestions` is a single monolithic procedure handling primary call, fallback call, and hydration in one function body (~200 lines). FR-1's fix (add an independent fallback tier) fits as an additional branch within this same procedure, following the existing try/catch structure — no new component is required.
- `YouMayAlsoLike`'s fallback chain is implemented entirely in the *frontend* component via cascading `enabled` react-query flags, not in a backend procedure. This is a legitimate but notable asymmetry: PDP's resilience logic lives client-side, cart's (post-fix) would live server-side. This is not a defect, but worth naming so a future engineer doesn't assume both surfaces' resilience patterns are structured the same way.
- `getShopRecommendations` being unused by the shop page's own SSR path (bullet above) means FR-4's caching (REN-160) must be applied to the direct `recommendationQueries.getPersonalizedRecommendations` call in `storefront-catalog-page.tsx`, not merely to the `getShopRecommendations` tRPC wrapper — caching only the wrapper would miss the actual hot path. This is a concrete, actionable implementation note for whoever picks up REN-160.
