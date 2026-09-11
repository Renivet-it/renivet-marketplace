# REN-148 — External search embedding sync cadence

## Outcome

Establish a documented, authenticated daily sync endpoint that fills missing
product search embeddings for the active, published, non-deleted catalog. Keep
the current external RAG search path unchanged; this is the staged cadence
step, not a search-architecture replacement.

## Evidence

- `src/scripts/generate-semantic-embeddings.ts` is a manually-run script that
  only processes products with missing 768-dimensional embeddings.
- `src/scripts/generate-suggestion-embeddings.ts` is a manually-run script and
  currently scans all products for 384-dimensional suggestion embeddings.
- No embedding route exists under `src/app/api/cron/*` and no repository cron
  schedule references either script.
- Existing cron routes use `requireCronSecret` and the `CRON_SECRET` bearer
  boundary, including `src/app/api/cron/finance/tds-fy-rollover/route.ts`.
- Product eligibility fields are `isActive`, `isPublished`, and `isDeleted` in
  `src/lib/db/schema/product.ts`; embedding columns are stored on `products`.
- The embedding provider is the external service used by
  `src/lib/python/sematic-search.ts`; provider failure must not corrupt rows.

## Approved implementation contract

- Add a reusable sync service with a maximum batch of 25 products per run,
  deterministic ID ordering, serial provider calls, a 10-minute run budget,
  and per-product failure isolation.
- Process only active, published, non-deleted products and update missing
  semantic and suggestion embeddings without changing search query behavior.
- Add a protected `GET /api/cron/search-embedding-sync` endpoint using the
  existing `CRON_SECRET` bearer authorization convention.
- Return coverage counters and failures for operational monitoring; do not
  expose embedding contents.
- Use the correct provider dimension for each column: `getEmbedding` for the
  384-dimensional suggestion vector and `getEmbedding768` for the
  768-dimensional semantic vector. Add a 15-second provider timeout and at
  most two retries per embedding request with bounded backoff.
- Prevent overlapping runs with a Postgres advisory lock. A lock miss returns
  a successful no-op response with `alreadyRunning: true`. The GET response
  uses `Cache-Control: no-store`.
- Re-check product eligibility in each update predicate. If one dimension
  fails, save only the other successful dimension and report the product as
  partially updated.
- Preserve the manual scripts for backfills and keep their invocation usable.
- Document the recommended daily cadence and scheduler request shape. Actual
  production scheduler registration remains deployment-operator configuration.
- Document Asia/Kolkata daily cadence, a 10-minute scheduler timeout, bearer
  secret usage, and retry expectations for the deployment operator.
- Keep external RAG calls and direct pgvector search architecture unchanged.

## Exclusions

- Replacing external RAG with direct pgvector search.
- Deleting, unpublishing, or otherwise mutating catalog records.
- Re-embedding every product on every run.
- Adding provider credentials to source or committing deployment secrets.

## Risk

This is L2: it touches an external integration, database writes, cron
authorization, runtime duration, and catalog coverage observability, but does
not change customer-facing search selection or delete data.

## Test expectations

- Unit tests for product eligibility, missing-embedding selection, batch
  limits, counters, and per-product failure isolation.
- Route tests for missing secret, invalid secret, successful sync, and provider
  failure response handling.
- Regression tests proving manual script entry points remain available and the
  storefront search query path is unchanged.
