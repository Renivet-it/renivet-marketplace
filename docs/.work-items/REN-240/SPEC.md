# REN-240 — Cart Cache Index

## Goal

Replace hot-path cart `KEYS` discovery with a derived per-user set index while validating cached membership against Postgres.

## Scope and design

- Use `cart:index:${userId}` with members equal to `cart:${userId}:${productId}` for a null variant or `cart:${userId}:${productId}:${variantId}` for a variant. Validation parses the optional final segment into the `(productId, variantId)` identity.
- `get()` loads Postgres with `getCartForUser`, reads the index, validates actual membership and cached values, and uses the existing drop-then-rebuild path on any mismatch. Count alone is insufficient.
- `add`/`addBulk` pipeline item SET plus index SADD; `remove` pipelines item DEL plus index SREM. Do not describe or rely on Redis pipeline atomicity.
- Cache/index mutation occurs only after the Postgres mutation has completed successfully in existing callers.
- Keep the seven-day item TTL; set and refresh the derived index to the same seven-day TTL on successful SADD. An absent index is a cold miss that rebuilds from Postgres without KEYS/SCAN.
- If a pipeline partially succeeds, treat the index as untrusted; the next read compares actual membership and rebuilds. Operations are idempotent. Every existing cart mutation path must await its Postgres mutation before cache/index mutation; no Promise.all may pair the authoritative write with cache writes.
- Normal cart reads contain no `KEYS` or `SCAN`; existing broad drop-all behavior remains outside the hot read path.

## Required test evidence

- Hit, miss, empty, stale count, same-count/different-membership, variant, mutation ordering, Redis unavailable, repeated-read, and concurrency paths.
- DB write failure causes no cache/index mutation.
- No normal `get()` calls `KEYS`/`SCAN`; mismatch invokes existing rebuild behavior.
