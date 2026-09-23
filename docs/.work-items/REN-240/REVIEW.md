# REVIEW: REN-240 — Replace cart hot-read KEYS with derived index

## Executive Result

REVIEW_PASSED — NO_DRIFT. Base commit is `e442b86a0a4a2daacd9c443a6db483241f8c27d6` and head commit is `4f5ae2d30242f8e56a1ff02df1f9cecb43e12ddd` on `feat/ren-238-239-240-upstash`. No governance re-entry is required.

## Review Scope and Git Evidence

Compared `origin/master` and commit `4f5ae2d30242f8e56a1ff02df1f9cecb43e12ddd`. Evidence includes `src/lib/redis/methods/cart.ts`, `src/lib/redis/methods/cart-key.ts`, `src/lib/redis/methods/cart.test.ts`, and all changed cart mutation paths in `src/lib/trpc/routes/general/cart.ts`.

## Requirement Reconciliation

REQ-240-1 through REQ-240-4: PASS. Hot reads use the derived index and MGET, mutation pipelines pair item/index operations without atomicity claims, DB membership is compared rather than counted, and mismatches rebuild from Postgres.

## Scenario Reconciliation

SCN-240-1 through SCN-240-4: PASS. The implementation covers indexed hits, cold/missing/mismatched/Redis-failure reads, variants, paired mutations, absent index rebuild, and idempotent derived state.

## Invariant Reconciliation

INV-240-1 through INV-240-5: PASS. Postgres is read first, the item key encodes user/product/optional variant, and Redis failure remains rebuildable.

## Flow and Architecture Review

FLOW-240-1: PASS. The existing cart cache gains only a derived user index; no migration, backfill, or new Redis product was introduced.

## Security and Integration Review

SEC-240-1, DEP-240-1, and DEP-240-2: PASS. Index members are user-scoped, Postgres remains authoritative, and existing seven-day item freshness is preserved with matching index expiry.

## Scope and Drift Review

NO_DRIFT. Changes are limited to the cart cache/index, required Postgres-first mutation ordering, tests, and task-local governance artifacts.

## Test Expectation Review

TEXP-240-1 through TEXP-240-4: PASS by static reconciliation; runtime results are reported separately by the implementation run.

## Findings

None.

## Decisions Requiring Attention

None.

## Final Recommendation

Accept REN-240 implementation after the branch is committed. No production deployment was performed.
