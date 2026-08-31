# Functional Requirements — P02

## FR-1 (REN-147): Independent fallback for cart cross-sell

FR-1.1. When `getAdvancedRecommendations` fails or returns no usable IDs for all cart items considered, the system MUST attempt a recommendation path that does not depend on the same external host (`64.227.137.174:8000`).

FR-1.2. The independent fallback SHOULD reuse the pattern already implemented and working on PDP (`YouMayAlsoLike`, `04-architecture/INTEGRATIONS.md`): same-brand best-sellers → same-category best-sellers → platform best-sellers, executed as plain Postgres queries via `productQueries`/`brands.products.getProducts`-equivalent.

FR-1.3. If even the independent fallback yields nothing, the cart cross-sell section MUST NOT render (unchanged current behavior for the true-empty case) — FR-1 addresses the *false*-empty case caused by a shared-host outage, not genuine no-results.

FR-1.4. The dead `EMBEDDING_SERVICE_URL`/hardcoded-host discrepancy in `getAdvancedRecommendations` and `getEmbedding768` (`01-research/EVIDENCE_INDEX.md` #1) MUST be resolved as part of this fix — either by making the env var authoritative, or by removing the vestigial env var read, so the actual routing behavior matches what the code claims to do. This is a config-hygiene requirement, not a new feature.

## FR-2 (REN-150): Rank-preserving personalized ordering on shop page

FR-2.1. The shop page's "Recommended" default sort MUST order products such that a product's position reflects its relative rank in `getPersonalizedRecommendations`'s output, not merely its membership in that output.

FR-2.2. The chosen implementation MAY be a true position-preserving `ORDER BY` (e.g., `CASE products.id WHEN id_1 THEN 0 WHEN id_2 THEN 1 ... END`, or a joined `VALUES`-table rank), or a coarser multi-bucket scheme (e.g., top-N / next-N / rest) — either satisfies "reflects rank," full binary bucketing does not. Choice is an implementation decision, not fixed by this package (see `05-algorithms/DECISION_LOGIC.md`).

FR-2.3. The misleading code comment at `src/lib/db/queries/product.ts:1447-1448` MUST be corrected to match whatever ordering behavior is actually implemented, so future readers aren't misled the way this audit's initial read nearly was.

## FR-3 (REN-157): Accurate recommendation copy

FR-3.1. All shopper-facing copy on cart cross-sell and PDP similar-products describing the *basis* for a suggestion MUST accurately reflect single-item similarity (e.g., "Similar style," "Because you viewed/added X") and MUST NOT claim basket-awareness, complementary-item reasoning, or "frequently bought together"-style claims that the system does not compute.

FR-3.2. Specific copy instances requiring change (verified locations): `wardrobe-suggestions.tsx:62` ("Matched using AI-powered similarity" — acceptable if "AI-powered" is defensible for a learned embedding model, but "similarity" must not be paired with cart-composition-implying surrounding copy), `:66` ("Complements your style choices" — implies judgment beyond similarity, should be revised), `:194` ("Complements your cart" — implies basket relationship, should be revised), `:113` (`LABELS` array: "Pairs well", "Complements" — implies relational judgment, should be revised to similarity-framed labels e.g. "Similar style", "You might like").

FR-3.3. Section header/subheader copy ("Complete Your Conscious Wardrobe" / "Thoughtfully curated pieces that pair beautifully with your selections," `wardrobe-suggestions.tsx:42-47`) MUST be reviewed for the same overclaim and revised if it implies wardrobe-completion logic beyond single-item similarity.

## FR-4 (REN-160): Cache personalized recommendation computation

FR-4.1. `getPersonalizedRecommendations`'s output (all branches: order-based, merged, platform-default) MUST be cached per user for a bounded TTL appropriate to how often the underlying signals change (see `06-data/DATA_REQUIREMENTS.md` for signal freshness windows already in use: 7-day browsing, 30-day wishlist, 90-day orders, 14-day search).

FR-4.2. `getAdvancedRecommendations`'s output SHOULD be cached per `productId` (not per user, since the primary-path result depends only on the target product, not on the requesting shopper) for a bounded TTL, benefiting both cart cross-sell and PDP simultaneously since they call the identical function.

FR-4.3. Cache invalidation is NOT required to be event-driven (e.g., product going out of stock) for V1 — a bounded TTL (see NFR performance targets) is sufficient given these are "suggestions," not authoritative inventory-bound content; a stale-but-plausible suggestion is an acceptable tradeoff already implicitly accepted by the current no-cache/always-fresh design's own tolerance for showing out-of-stock-adjacent items (existing `getWardrobeSuggestions` query already filters `isAvailable`/`isActive` at read time regardless of cache).

## FR-5 (REN-165 — VERIFICATION SCOPE ONLY, not a build requirement)

FR-5.1. Conduct verification (see `09-validation/EXPERIMENT_STRATEGY.md`) to determine whether a post-purchase recommendation surface would be used/valued. No functional requirement for the surface itself is specified here pending that verification's outcome.

## FR-6 (REN-168 — EXPLICITLY OUT OF SCOPE)

FR-6.1. No functional requirements are specified for genuine basket co-occurrence in this package. See `10-roadmap/VERSION_TRIGGERS.md` for the gating condition that would need to be met before this gets its own requirements pass.
