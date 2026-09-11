# Non-Functional Requirements — P02

## Reliability / availability

NFR-1. Cart cross-sell availability MUST NOT be coupled 1:1 to the external ML host's availability after FR-1 ships. Target: the section renders *some* result in ≥95% of cases where the shopper's cart is non-empty and at least one fallback tier (independent-DB fallback or true-empty) can resolve, even during a full external-host outage. **INFERRED target** — no existing SLO exists to anchor this number; treat as a starting proposal for `09-validation/SUCCESS_METRICS.md`, not a contractual figure.

NFR-2. No recommendation surface's failure may throw an unhandled error that breaks the surrounding page (cart page, PDP, shop page). This is largely already true (`getWardrobeSuggestions` wraps its body in try/catch returning `[]`; `getRecommendations` on PDP throws a tRPC error but the frontend's `retry: false` + cascading `enabled` fallbacks contain it) — NFR-2 is a **regression guard**, not new behavior, to be preserved through the FR-1/FR-4 changes.

## Performance / latency

NFR-3. Post-FR-4 (caching), cached recommendation reads (cache hit) should return in low tens of milliseconds (typical Redis/`unstable_cache` read latency in this codebase's existing patterns) rather than the current uncached path's dependency on external HTTP round-trip time (ML host) or multiple sequential/parallel DB queries. **INFERRED** — no current latency measurements exist for these endpoints (ties to REN-160/165's measurement gap); this is a directional target, not a measured baseline.

NFR-4. Cache TTLs (FR-4.1/4.2) must be short enough that a shopper who adds/removes cart items within a session does not perceive cross-sell suggestions as obviously stale relative to their current cart contents. Concretely: cart cross-sell is keyed by product IDs, not "current cart state" as a whole, so per-product-ID caching (FR-4.2) is inherently safe against cart-mutation staleness — the risk is isolated to the shop-page personalized cache (FR-4.1), which should have a TTL short enough (e.g., minutes, not hours) that a shopper's browsing session doesn't feel disconnected from their most recent actions. Exact TTL is a DECISION REQUIRED implementation choice, not fixed here.

## Security

NFR-5. No PII beyond `userId` (already used throughout the existing recommendation code) should flow to the external ML host. **CONFIRMED as already true**: `getAdvancedRecommendations`/`getEmbedding768` calls only ever pass `productId` or derived product-title/brand text — never `userId`, email, or order data. This must not regress under FR-1/FR-4 changes.

NFR-6. Caching personalized results (FR-4.1) must key cache entries by `userId` with no cross-user leakage risk — this is a standard requirement for any per-user cache and is called out explicitly because `getPersonalizedRecommendations` branches on `userId` internally; a caching layer added carelessly (e.g., keyed only by generic route/query params without `userId`) could leak one shopper's personalized list to another. See `08-reliability/SECURITY.md`.

## Observability

NFR-7. Once REN-160's caching lands, cache hit/miss and external-ML-call success/failure should be logged or metriced at a level sufficient to detect a repeat of REN-147's failure mode (silent full-surface loss) proactively rather than by user complaint. No specific tool is mandated; existing `console.error`/`console.log` patterns in this codebase are the current baseline (see `08-reliability/OBSERVABILITY.md`) and are explicitly assessed as insufficient for this purpose.

## Maintainability

NFR-8. Code comments describing ordering/ranking behavior (per FR-2.3) must accurately describe the implementation they sit above — this is a direct response to the confirmed comment/implementation mismatch found at `src/lib/db/queries/product.ts:1447-1448` and is called out as a standing principle for this Epic's changes, not just the one line.
