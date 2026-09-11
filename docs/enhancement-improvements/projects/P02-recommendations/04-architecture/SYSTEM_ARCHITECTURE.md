# System Architecture — P02 (Current State)

**No formal architecture document exists today for recommendations** (CONFIRMED — no design doc found in the repo; this file documents the architecture as reverse-engineered from source, not an existing design artifact).

## Current architecture, as built

```
                         ┌─────────────────────────────┐
                         │  External ML microservice    │
                         │  http://64.227.137.174:8000  │  (shared with P01/Search)
                         │  - /recommendations/          │
                         │      similar-advanced         │
                         │  - /embeddings/generate-768    │
                         │  - /embeddings/generate         │
                         └───────────┬──────────────────┘
                                     │ axios HTTP calls
                    ┌────────────────┼─────────────────────┐
                    │                │                      │
        ┌───────────▼────────┐  ┌────▼─────────┐   ┌────────▼────────┐
        │ getAdvancedRecs()   │  │ getEmbedding  │   │ (P01 search –    │
        │ product-recommend-  │  │ 768()          │   │  out of scope    │
        │ ation.ts            │  │ sematic-search │   │  here)           │
        └───────┬─────────────┘  └──────┬────────┘   └─────────────────┘
                │                        │
   ┌────────────┼────────────┐          │
   │            │            │          │
┌──▼───┐   ┌────▼──────┐  ┌──▼──────────▼───┐
│ Cart  │   │ PDP        │  │ Cart fallback    │
│ cross-│   │ getRecom-  │  │ (vector search,  │
│ sell  │   │ mendations │  │ same host)       │
│(primary)  │ (only sig- │  │ REN-147 defect   │
│       │   │ nal source)│  │                  │
└───────┘   └──────┬─────┘  └──────────────────┘
                    │ (if empty)
             ┌──────▼──────────────────────────┐
             │ PDP frontend fallback chain       │
             │ (independent of ML host):         │
             │ same-brand → same-category →      │
             │ platform best-sellers (Postgres)  │
             └────────────────────────────────────┘

        ┌─────────────────────────────────────────────┐
        │ Shop-page personalized sort                    │
        │ getPersonalizedRecommendations()               │
        │ (Postgres-only, no external ML call):          │
        │  orders → merged(browsing+wishlist+search)     │
        │  → platform defaults                            │
        │ Output: ranked productId list                  │
        │           │                                     │
        │           ▼                                     │
        │ getProducts({ priorityProductIds })             │
        │  → REN-150: binary bucket, rank discarded       │
        └─────────────────────────────────────────────┘
```

## Key architectural facts (CONFIRMED)

1. **Two independent recommendation engines exist**, not one: (a) the external ML similarity service (single-item nearest-neighbor, used by cart + PDP), and (b) the in-house Postgres-based multi-signal scorer (`recommendationQueries`, used only by shop-page sort and, per its own code, callable generically as `getShopRecommendations` but not wired into cart or PDP). These are architecturally and operationally separate — different failure modes, different data sources, different latency profiles.
2. **Cart and PDP share the exact same primary-signal function** (`getAdvancedRecommendations`) but have diverged fallback architectures — PDP's is host-independent (Postgres), cart's is not (same ML host). This divergence is undocumented (no design doc explains why) and is the root of REN-147.
3. **No service boundary / no internal recommendation API.** Each surface calls the relevant function directly from its tRPC route; there is no shared "recommendation service" module that all three surfaces go through. This means fixes (e.g., caching) must currently be applied per call-site rather than in one place — a maintainability cost worth naming (see `11-critique/ARCHITECTURE_CRITIQUE.md`).
4. **No caching layer** sits between any surface and its data source (external ML or Postgres) for recommendation-specific computation.

## Target-state note

This package's V1 scope (`10-roadmap/V1.md`) does not propose introducing a unified recommendation service layer — that would be overengineering relative to REN-147/150/157/160's actual scope (see `11-critique/ANTI_OVERENGINEERING_REVIEW.md`). V1 fixes are applied at existing call sites, following the pattern PDP already demonstrates for fallback (fact #2 above) and the pattern `unstable_cache` already demonstrates for caching (see `CURRENT_STATE.md`).
