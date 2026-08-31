# Business Context — P02 Recommendations & Personalization

## Why this matters (CONFIRMED — product surfaces exist and are live)

Renivet is a fashion/lifestyle marketplace. Three surfaces currently claim to personalize or recommend products to shoppers:

- Cart page: "Complete Your Conscious Wardrobe" cross-sell panel, captioned "Thoughtfully curated pieces that pair beautifully with your selections" (`src/app/(protected)/mycart/Component/wardrobe-suggestions.tsx:42-47`).
- Product detail page: "You May Like" carousel (`src/components/products/product/product-recommendation.tsx`).
- Shop page: default "Recommended" sort order, applied when a signed-in shopper lands on `/shop` with no filters (`src/components/shop/storefront-catalog-page.tsx:560-602`).

These surfaces exist to increase attach rate (cart cross-sell), discovery/conversion on PDP, and relevance of the default shop feed. **INFERRED** — no analytics dashboards or conversion targets for these specific surfaces were found in the codebase; business value is asserted by the surfaces' presence and copy, not measured (this is exactly REN-160/165's gap, and ties to `../../02-epics/EPIC_MAP.md`'s P07/measurement dependency).

## The core problem this Epic addresses (CONFIRMED via source verification)

The UI copy promises more than the system delivers, and the reliability model is weaker than the copy implies:

1. **Overclaimed capability.** Copy across cart and PDP ("AI-powered similarity," "Complements your style choices," "Pairs well," "pair beautifully with your selections") implies a relationship-aware, basket-level recommendation engine. The actual signal, on both surfaces, is a single-item nearest-neighbor similarity lookup against one external service — there is no co-occurrence, complementary-item, or basket-level logic anywhere in the codebase (verified: `src/lib/trpc/routes/general/cart.ts:748-757` and `src/lib/trpc/routes/brands/products.ts:1966-1987` both resolve through the identical `getAdvancedRecommendations(productId)` call in `src/lib/python/product-recommendation.ts`).
2. **Silent full-surface failure.** Cart cross-sell's "fallback" path, meant to protect against the primary call failing, targets the identical external host as the primary call (both hardcode `http://64.227.137.174:8000`, verified in `src/lib/python/product-recommendation.ts:10` and `src/lib/python/sematic-search.ts:11,42`). An outage of that one host doesn't degrade cart cross-sell to something generic — it removes the entire section from the page, with no error surfaced to the shopper or an obvious signal to the business that the feature has gone dark.
3. **Personalization computed then discarded.** The shop page's "Recommended" sort computes a real per-shopper ranked product list (`recommendationQueries.getPersonalizedRecommendations`) but then only uses membership in that list (in vs. out — `CASE WHEN id IN (...) THEN 0 ELSE 1 END`) to bias final ordering, discarding the actual computed rank (`src/lib/db/queries/product.ts:1446-1453`). The engineering work of building order/wishlist/browsing/search-based scoring produces a result that is materially better than what the shopper sees.
4. **No caching.** Every personalized computation (cart cross-sell's ML calls, shop's multi-source scoring query, `getPersonalizedRecommendations`'s up-to-4 parallel DB queries) runs from scratch on every request. No `unstable_cache`, Redis, or other cache wraps recommendation computation anywhere (the only caching present, `getCachedDefaultProducts`/`getCachedNewArrivalProducts` in `storefront-catalog-page.tsx:424-460`, covers the *non-personalized fallback* product listings, not personalization itself).

## What is explicitly NOT in scope for committed work

- **REN-165** (post-purchase/order-confirmation recommendation surface): a verification-only backlog item, PROBABLE confidence in both audit rounds. It is a possible missed merchandising opportunity, not a confirmed defect. This package treats it as **DECISION REQUIRED**, not as a requirement to build.
- **REN-168** (genuine basket co-occurrence / "frequently bought together" signal): explicitly deferred, tracked as "do not build speculatively," gated on demonstrated business need (see `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md` and `10-roadmap/VERSION_TRIGGERS.md` for what "demonstrated" means).
- **RE-F008** (recently-viewed is browser-local only): QC disposition NO-ACTION, no demonstrated harm, not tracked in Linear. Not resurrected here.

## Shared infrastructure context (CONFIRMED)

P02 and P01 (Search) both depend on the same external ML microservice at `http://64.227.137.174:8000` (P01 uses it for search-adjacent embeddings; P02 uses `/recommendations/similar-advanced` and `/embeddings/generate-768`). This is a shared-infrastructure relationship, not a directional dependency — see `../../DEPENDENCY_GRAPH.md`. REN-146 (P01's issue, hardening the shared service with timeouts) benefits P02 equally, but does not by itself fix REN-147 (P02's fallback still hits the same host even if that host is hardened).
