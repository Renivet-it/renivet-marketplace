# Business Rules — P02

BR-1. A product recommended to a shopper MUST pass the same availability/publication gates already enforced today: `isAvailable`, `isActive`, `isDeleted = false`, `isPublished`, `verificationStatus = 'approved'` (confirmed present in all three surfaces' underlying queries — `cart.ts:803-807,855-859`, `product.ts` product-listing filters, `recommendation.ts`'s `activeBrandFilter` + shared filter set). This rule is unchanged by this Epic and must be preserved by any caching (FR-4) — a cached recommendation list must not surface a product that has since become unavailable; either short TTLs or a light re-validation pass at read time is required (implementation choice, not fixed here).

BR-2. A recommended product MUST NOT be a product already in the shopper's cart (cart cross-sell) — confirmed enforced via `cartProductIds` exclusion set (`cart.ts:746,766,828`). Preserve under FR-1's new fallback tier.

BR-3. A recommended product on PDP MUST NOT be the product currently being viewed — confirmed enforced via `excludeProductId` filtering at every tier of `YouMayAlsoLike`'s fallback chain (`product-recommendation.tsx:170-284`). No change.

BR-4. The shop page's personalized sort only activates for a signed-in shopper on an unfiltered, unpaginated, default-sort view (`shouldUseRecommendations` gate, `storefront-catalog-page.tsx:560-572`) — any active search, filter, category, brand, or price constraint bypasses personalization entirely and falls through to standard sort/filter logic. This is existing, unchanged business logic; FR-2's fix operates *within* this gate, it does not change when personalization applies.

BR-5. Recommendation copy (per FR-3) must not use superlative or capability claims ("AI-powered," "curated," "complements") that a reasonable shopper would interpret as basket-level or human-curated judgment, when the underlying computation is single-item similarity. This is a new business rule introduced by this Epic's requirements (FR-3), not a pre-existing one — it formalizes what REN-157 is asking for.

BR-6 (gating rule for REN-168). No basket co-occurrence feature may be built until a demonstrated-need trigger (see `10-roadmap/VERSION_TRIGGERS.md`) is met and separately approved. This rule exists specifically to prevent this documentation package itself from being read as authorization to build V2/V3 speculative work.
