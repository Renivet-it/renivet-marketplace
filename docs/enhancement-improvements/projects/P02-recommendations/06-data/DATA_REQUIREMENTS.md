# Data Requirements — P02

## Data already available and in use (CONFIRMED)

| Data | Source | Used by | Freshness window in use |
|---|---|---|---|
| Cart contents | `userCartCache` (Redis) | Placement A | Real-time (cache mirrors live cart state) |
| Product catalog (title, brand, category, price, media, availability flags) | Postgres `products`/`productVariants`/`brands` | All placements | Real-time (read at request time) |
| `semantic_search_embeddings` (pgvector column on `products`) | Postgres | Placement A fallback only | **UNKNOWN** population/refresh cadence — no ingestion job found in this pass |
| Order history | Postgres `orders`/`orderItems` | Placement C (order-based branch) | 90-day window (`TIME_WINDOWS.ORDER_HISTORY_DAYS`) |
| Wishlist | Postgres `wishlists` | Placement C (merged branch) | 30-day window |
| Product view/click/add-to-cart events | Postgres `productEvents` | Placement C (browsing-history branch) | 7-day window, weighted (add_to_cart=5, click=2, view=1) |
| Search history | Postgres `searchAnalytics` | Placement C (search-driven branch) | 14-day window |
| External single-item similarity scores | External ML service response | Placements A, B | Computed on demand, no persistence today |

## Data required for V1 fixes (this Epic's confirmed scope)

- **FR-1 (fallback):** no new data — reuses existing `products`/`brands` category/brand fields already read elsewhere (e.g., Placement B's fallback chain).
- **FR-2 (ranking):** no new data — `priorityProductIds`'s existing array order is sufficient input; the fix is consumption logic, not a new data source.
- **FR-4 (caching):** no new persistent data — requires a cache store (Redis, already used elsewhere in this codebase for `userCartCache`/`mediaCache`, is the natural choice) holding transient, TTL-bound copies of computation results. Cache key design: `productId` for Placements A/B (per `05-algorithms/DECISION_LOGIC.md`), `userId` for Placement C.

## Data that does NOT exist and is NOT required for V1 (explicitly out of scope)

- Any co-purchase/"bought together" aggregate table (REN-168 territory — deferred).
- Any recommendation-impression/click event schema (would be needed for REN-160/165's *measurement* question, not for shipping the V1 fixes themselves — see `09-validation/SUCCESS_METRICS.md`).
- Any post-purchase-specific data model (REN-165 — verification-only, no build).

## Data quality dependency on P08 (catalog)

Per `../../DEPENDENCY_GRAPH.md`, recommendation quality on all placements depends on catalog data completeness owned by P08 (Brand & Data Integration) — e.g., missing/incorrect `categoryId`, missing media, or missing `semantic_search_embeddings` entries would degrade any of the three placements regardless of this Epic's fixes. This is a **noted cross-Epic dependency**, not something P02's V1 scope can or should remediate — see `07-feasibility/DEPENDENCIES.md`.
