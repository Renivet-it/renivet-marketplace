# Integrations — P02

## External: shared ML microservice (CONFIRMED)

- Host: `http://64.227.137.174:8000` — a raw IP, hardcoded as a string literal in three call sites (`product-recommendation.ts:10`, `sematic-search.ts:11`, `sematic-search.ts:42`), not resolved via env var despite an unused `EMBEDDING_SERVICE_URL` read in `product-recommendation.ts:5-6`.
- Endpoints consumed by P02: `GET /recommendations/similar-advanced` (params: `product_id`, `top_n=28`), `POST /embeddings/generate-768` (body: `{ text }`).
- Shared with P01 (Search) — same host, different endpoints (P01 presumably uses `/embeddings/generate` or `/generate-768` for query embeddings; not verified in this pass, out of scope — see P01's own package). Per `../../DEPENDENCY_GRAPH.md`, this is a shared-infrastructure relationship: REN-146 (P01's issue, timeouts/hardening on this host) benefits P02's request reliability *if and when the host is up*, but does not address REN-147 (P02's problem is architectural — no independent path — not merely "the host has no timeout").
- No authentication, retry policy, or circuit breaker observed on any call to this host from P02's code (`axios.get`/`axios.post` with no `timeout` option set, no retry wrapper). This is consistent with — and a contributing cause of — REN-147's failure mode, and is flagged here as a fact for `08-reliability/FAILURE_MATRIX.md`, not re-litigated as a separate requirement (REN-146 already covers hardening this call pattern; this package's FR-1 is about *not being solely dependent* on this host, which is a complementary, not competing, fix).

## Internal: Postgres (via Drizzle ORM)

- `products`, `productVariants`, `brands`, `orders`, `orderItems`, `wishlists`, `productEvents`, `searchAnalytics` tables are read directly by `recommendationQueries` and by the fallback/hydration paths in `getWardrobeSuggestions` and `YouMayAlsoLike`'s fallback tiers.
- `products.semantic_search_embeddings` (pgvector column) is used only by cart's same-host vector-search fallback (Flow 1, step 7) — this is a Renivet-owned data asset (embeddings presumably pre-computed and stored, likely by a job outside this codebase's visible scope — **UNKNOWN** how/when these embeddings are populated; no ingestion job was found in this pass, out of scope to chase further here since REN-147's fix does not depend on resolving this unknown).

## Internal: Redis (via existing cache method modules)

- `userCartCache`, `userWishlistCache`, `mediaCache` — used for cart/wishlist state and media URL hydration, not for recommendation *computation* caching (confirmed absence, see `01-research/EVIDENCE_INDEX.md` #4).
- `next/cache`'s `unstable_cache` (not Redis, but functionally a cache layer) — used only for non-personalized default/new-arrivals listings today; this is the mechanism FR-4 proposes extending or paralleling for personalized results.

## Analytics (context, not modified by this Epic)

- PostHog (`posthog.capture`) and an internal `analytics.track` (brand-events) are used for cart add/remove and wishlist events elsewhere in `cart.ts`, but **not** for any recommendation-impression or recommendation-click event. This confirms REN-160/165's underlying measurement gap: there is no event schema today that would let anyone measure "did a shopper act on a recommendation," which is exactly why REN-165's verification question can't currently be answered from existing data (see `09-validation/SUCCESS_METRICS.md`).

## Cross-Epic integration note (P01 shared dependency)

Any change to `getAdvancedRecommendations`'s or `getEmbedding768`'s calling convention (e.g., adding a timeout, changing the hardcoded host to an env-driven one, per FR-1.4) touches code paths P01 (Search) may also depend on indirectly through the shared `sematic-search.ts` module. Coordination with whoever owns P01's REN-146 work is recommended before either ships changes to these shared functions, to avoid one Epic's fix silently altering the other's behavior. This is a coordination note, not a blocking dependency — see `07-feasibility/DEPENDENCIES.md`.
