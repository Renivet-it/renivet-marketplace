# State Machine — P02

Recommendation surfaces are largely stateless per-request computations, not long-lived stateful workflows. This file documents the request-scoped state transitions that exist, per surface.

## Cart cross-sell render states (`WardrobeSuggestions`, confirmed from component logic)

```
[cart empty] ──────────────────────────────────► render: null
     │ cart non-empty
     ▼
[query loading] ───────────────────────────────► render: SuggestionsSkeleton
     │ query resolves
     ▼
[suggestions undefined/empty] ─────────────────► render: null  (no error state shown)
     │ suggestions.length > 0
     ▼
[render suggestion grid] ── shopper clicks "Add to Bag" on card ──► [addToCartMutation pending]
                                                                          │ success
                                                                          ▼
                                                                 [card shows "Added to Bag", cart + suggestions queries invalidated]
```

**Post-FR-1 addition:** a new implicit state exists server-side between "primary ML call" and "independent DB fallback" (distinct from today's "primary" → "same-host vector fallback" → empty). This is a backend branching change, not a new frontend render state — the frontend state machine above is unaffected by FR-1; only the population of `suggestions` at the "query resolves" transition changes.

## PDP similar-products render states (`YouMayAlsoLike`, confirmed)

```
[primary query pending] ──► render: skeleton (isResolvingFallbacks = true)
        │ primary resolves
        ▼
[normalizedPrimaryProducts.length > 0] ──► render: carousel (primary results)
        │ length === 0
        ▼
[same-brand query enabled+pending] ──► render: skeleton
        │ resolves, length > 0 ──► render: carousel (same-brand)
        │ resolves, length === 0
        ▼
[same-category query enabled+pending] ──► render: skeleton
        │ resolves, length > 0 ──► render: carousel (same-category)
        │ resolves, length === 0
        ▼
[best-sellers query enabled+pending] ──► render: skeleton
        │ resolves, length > 0 ──► render: carousel (best-sellers)
        │ resolves, length === 0 ──► render: null
```

This cascading-`enabled` pattern is itself a form of client-driven state machine and is confirmed working as designed (this is the pattern FR-1 borrows for cart, per `INTEGRATIONS.md`).

## Shop-page sort: not a stateful transition, a per-request branch

`shouldUseRecommendations` / `isDefaultView` / `isDefaultNewArrivalsView` (storefront-catalog-page.tsx:560-637) are mutually-exclusive per-request boolean gates evaluated fresh on every server render — there is no client-visible loading/transition state distinct from normal page navigation. REN-150's fix (FR-2) changes what happens *inside* the `shouldUseRecommendations = true` branch's product ordering; it does not add or remove states in this diagram.

## Applicability note

A more elaborate state machine (e.g., covering cache-hit/cache-miss/cache-stale states per FR-4) is not modeled in detail here because caching is a cross-cutting performance concern applied transparently underneath these existing flows — see `04-architecture/DATA_FLOW.md` Flow 4. Modeling cache states as a separate machine would be premature detail for a TTL-based cache with no event-driven invalidation (FR-4.3).
