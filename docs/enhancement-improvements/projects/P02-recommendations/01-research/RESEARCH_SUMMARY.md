# Research Summary — P02

## Method

This pass re-derived every claim in the prior portfolio-governance summary against the live source in `renivet-marketplace` (not `git log`/blame — direct file reads), specifically:

- `src/app/(protected)/mycart/Component/wardrobe-suggestions.tsx`
- `src/lib/trpc/routes/general/cart.ts` (`getWardrobeSuggestions`)
- `src/lib/python/product-recommendation.ts` (`getAdvancedRecommendations`)
- `src/lib/python/sematic-search.ts` (`getEmbedding`, `getEmbedding768`)
- `src/components/products/product/product-recommendation.tsx` (`YouMayAlsoLike`)
- `src/lib/trpc/routes/brands/products.ts` (`getRecommendations`, `getShopRecommendations`)
- `src/lib/db/queries/recommendation.ts` (`RecommendationQuery` / `recommendationQueries`)
- `src/components/shop/storefront-catalog-page.tsx` (shop-page sort orchestration, caching)
- `src/lib/db/queries/product.ts` (`getProducts`, `priorityProductIds` ordering)
- `src/app/(protected)/mycart/Component/empty-cart-recommendations.tsx` (adjacent context)
- Portfolio docs: `../../02-epics/EPIC_MAP.md`, `../../DEPENDENCY_GRAPH.md`, `../../AUDIT_TO_BACKLOG_TRACEABILITY.md`

## Findings vs. prior summary

| Prior claim | Verdict | Detail |
|---|---|---|
| REN-147: fallback hits same host as primary | **CONFIRMED, and sharper than stated** | Not just "same host" in a loose sense — both `getAdvancedRecommendations` and `getEmbedding768` hardcode the literal string `http://64.227.137.174:8000`. Additionally, `getAdvancedRecommendations` computes an env-var-driven `baseUrl` that is dead code — never referenced in the actual request. See `EVIDENCE_INDEX.md` #1. |
| REN-150: binary bucket collapse | **CONFIRMED, and the in-code comment is itself wrong** | The comment directly above the offending `ORDER BY` clause claims position-based sorting; the SQL implements membership-only bucketing. This is worth flagging separately in code review terms even though this package doesn't fix it. See `EVIDENCE_INDEX.md` #2. |
| REN-157: cart and PDP call identical single-item function | **CONFIRMED exactly** | Both routes resolve to the same `getAdvancedRecommendations(productId)` call, no parameter or logic divergence. See `EVIDENCE_INDEX.md` #3. |
| REN-160: no caching of recommendation computation | **CONFIRMED** | Zero cache wrapping on any of the four computation paths (cart's two-tier ML call, PDP's ML call, shop's DB-scoring cascade). The only caching in the vicinity wraps *non-personalized fallback* listings, which is a different thing. See `EVIDENCE_INDEX.md` #4. |
| (Not in prior summary) PDP has an independent, non-ML fallback chain | **NEW FINDING** | `YouMayAlsoLike` has a real 3-tier DB-only fallback (same-brand → same-category → platform best-sellers) that does not share fate with the external ML host. This is architecturally healthier than cart's fallback and is a candidate template for fixing REN-147. See `EVIDENCE_INDEX.md` #5. |
| REN-165: post-purchase surface verification-only | **Unchanged — no code found** | No post-purchase/order-confirmation recommendation component exists anywhere in `src/app`. Confirms absence; does not resolve the verification question (that requires business/analytics input this pass cannot produce). |
| REN-168: deferred co-occurrence signal | **Unchanged — no code found** | No co-purchase/basket-affinity table, job, or query exists. Confirms the deferred status is accurate (nothing to accidentally resurrect). |
| RE-F008: recently-viewed browser-local only | **Not re-investigated** — NO-ACTION disposition stands, out of scope per orchestrator instruction. |

## New/refined evidence not in the prior summary

1. **Dead env-var config** in `getAdvancedRecommendations` (`product-recommendation.ts:5-10`): `EMBEDDING_SERVICE_URL` is read into `baseUrl` but the actual `axios.get` call uses a separate hardcoded string. This means REN-147's fix cannot be "just set an env var to a different host" — the hardcoding itself has to be removed as part of the fix, and P01's REN-146 (hardening the shared service with timeouts) does not, by itself, give P02 a way to route around a dead host. Documented, not fixed, per instructions.
2. **PDP's fallback chain asymmetry** is the single most useful architectural fact this pass surfaced: Renivet's engineers already built a genuinely independent fallback pattern for one recommendation surface (PDP) but not the other (cart), despite both having the identical primary-call fragility. This reframes REN-147's fix from "design a new fallback" to "port an existing, working fallback pattern from PDP to cart" — materially lower complexity and risk than the prior summary implied.
3. **`priorityProductIds` reused across product-listing surfaces** (`src/lib/db/queries/product.ts:5182-5191`, a `popularityScore`-based ranking path) shares the same binary-bucket ordering bug. Not separately tracked in Linear; noted in `08-reliability/FAILURE_MATRIX.md` as a related-but-out-of-scope observation (only the shop-page "Recommended" sort instance is REN-150's scope — a broader fix to `priorityProductIds` semantics would need its own issue, not implied by this package).

## Confidence

All CONFIRMED items above are based on direct, current-session file reads of the exact line ranges cited — not memory, not the prior summary. No source code was found to contradict the prior summary; it was found to *understate* REN-147's severity (dead config) and to *omit* a materially relevant asymmetry (PDP's working fallback).
