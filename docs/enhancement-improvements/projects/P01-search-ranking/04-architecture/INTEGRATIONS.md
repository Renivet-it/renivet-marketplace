# Integrations — P01

| Integration | Direction | Protocol | Auth | Timeout today | Notes |
|---|---|---|---|---|---|
| External ML/search microservice | Renivet → external | Plain HTTP, hardcoded IP literal `64.227.137.174:8000` | UNKNOWN — no auth header/token found in any of the 5 call sites (CONFIRMED absence in code read) | None (CONFIRMED, all 5 sites) | REN-146 scope. Non-TLS is itself a finding — see `08-reliability/SECURITY.md`. |
| Postgres (`brands.embeddings`, `products.embeddings`, `searchAnalytics`, `searchIntents`) | Renivet → own DB | Drizzle ORM / `pgvector` extension | N/A (internal) | Standard DB pool (not scoped to this Epic; DB pool sizing is REN-139, a separate infra issue) | Live for brand embeddings; `products.*embeddings` written-only |
| Redis (`mediaCache`) | Renivet → own cache | Internal client | N/A (internal) | Not scoped here (Redis client tuning is REN-140, separate infra issue) | Reused, not replaced, for REN-159's proposed listing cache |

## Shared dependency with P02

The external ML/search microservice is called by both this Epic (`sematic-search.ts`, `product.ts`'s RAG fetch, suggestions route) and P02's `product-recommendation.ts`. REN-146's fix (timeouts + endpoint config) is the one piece of work in this Epic whose benefit is not P01-exclusive — see `../../DEPENDENCY_GRAPH.md`'s shared-infrastructure edge. This document does not expand P01's scope to touch P02's recommendation logic; only the shared low-level HTTP-client pattern is relevant here.

## No integrations found that are out of scope but adjacent

- No payment, shipping, or auth integration touches this Epic's code paths (CONFIRMED — `getProducts`/`search-engine.ts` do not import any of those modules).
- No analytics platform (PostHog/GA4/Meta CAPI, per P06) is currently written to from search — `searchAnalytics` is Renivet's own Postgres table, not a third-party event pipe. REN-154's future click logging stays within this same internal table; it does not require a new external integration.
