# Current Algorithm — by placement

Per-placement breakdown: objective, candidate generation, filtering, ranking, diversity, fallback, measurement. All CONFIRMED from source unless marked.

## Placement A: Cart cross-sell

- **Objective (INFERRED from copy/placement):** increase attach rate by suggesting additional items while the shopper is in a buying mindset.
- **Candidate generation:** up to 3 cart items → per-item call to external single-item similarity model (`getAdvancedRecommendations`, `top_n=28` per call, i.e., up to 84 raw candidates before dedup).
- **Filtering:** dedupe across the 3 calls; exclude anything already in cart; cap at 8 target IDs; DB-level availability/publication filters applied when hydrating.
- **Ranking:** none beyond the external model's own internal ordering per call and simple concatenation order across the 3 items' results (no explicit re-ranking or score blending across items).
- **Diversity:** none — no category/brand diversity logic; if all 3 cart items are similar to each other, suggestions likely cluster around one category/brand.
- **Fallback:** same-host vector search (REN-147 defect — not independent).
- **Measurement:** none (no impression/click event distinct from generic `CART.ADDED` when a suggestion is added to cart via the "Add to Bag" button on a card — that click *is* trackable as a normal cart-add event, but nothing distinguishes "this cart-add originated from a cross-sell card" from any other cart-add in the analytics captured today).

## Placement B: PDP "similar products"

- **Objective (INFERRED):** aid discovery/conversion by showing visually/stylistically adjacent products.
- **Candidate generation:** single call to `getAdvancedRecommendations(viewedProductId)`, `top_n=28`.
- **Filtering:** exclude the viewed product itself; cap at 8 (`FINAL_RECOMMENDATION_LIMIT`).
- **Ranking:** external model's own ordering, unmodified.
- **Diversity:** none.
- **Fallback:** independent 3-tier Postgres chain (same-brand best-sellers → same-category best-sellers → platform best-sellers) — genuinely working, host-independent.
- **Measurement:** none (same gap as Placement A).

## Placement C: Shop-page personalized sort ("Recommended" default)

- **Objective (INFERRED):** make the default browsing order feel relevant to a returning shopper's known interests.
- **Candidate generation:** the *entire* published/available catalog is the candidate pool (this is a sort/re-rank of the full listing, not a small candidate set) — personalization only affects order, via `priorityProductIds`, layered onto the standard `getProducts` listing query.
- **Filtering:** standard listing filters (availability, publication, etc.) apply as normal; the personalization signal itself is computed over a bounded set (order history ≤10 recent items / wishlist ≤10 items ≤30 days / browsing ≤20 unique products ≤7 days / search ≤5 queries ≤14 days) which determines category/brand/product-type match targets, not the final candidate pool.
- **Ranking:** intended design (per code comments and the shape of `getPersonalizedRecommendations`'s output) is a true rank; actual implementation collapses to a binary in-list/out-of-list bucket (REN-150 defect) before best-seller/recency tie-breakers apply.
- **Diversity:** the order-based and browsing-based branches explicitly prioritize category/brand/type match, which is the opposite of diversity by design (intentionally narrow toward known preference) — this is a deliberate current design choice, not a defect, though it does mean this placement does not attempt to broaden a shopper's exposure.
- **Fallback:** platform defaults (best-sellers/newest), used when signal is thin (<5 merged results) or shopper is signed out/new — this fallback is Postgres-only from the start (no ML host dependency in this placement at all), so it does not exhibit REN-147's failure mode.
- **Measurement:** none beyond generic page-view/click tracking already present in the app; no attribution of shop-page conversions to "was this because of personalized sort vs. filter/search."

## Placement D: Post-purchase (SPECULATIVE — does not exist)

No algorithm exists. REN-165 is a verification question about whether to build one, not a description of an existing (even flawed) implementation. Listed here only to keep the placement taxonomy complete and to make the absence explicit, per the orchestrator's instruction to mark this placement as speculative/verification-only.
