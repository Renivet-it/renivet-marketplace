# Upstash Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Redis observability accurate, media cache reads resilient, and cart reads index-backed while keeping Postgres authoritative and Redis disposable.

**Architecture:** Extend the existing ioredis Proxy/pipeline boundary for aggregate metrics. Keep media canonical keys and DB fallback in `media.ts`; use a user-scoped Redis set as a rebuildable cart index in `cart.ts`. No new Redis service, schema migration, or production configuration is introduced.

**Tech Stack:** TypeScript, Bun tests, ioredis, AsyncLocalStorage, Drizzle/Postgres.

**Spec:** `docs/.work-items/REN-238/SPEC.md`, `REN-239/SPEC.md`, `REN-240/SPEC.md`

## Global Constraints

- Postgres remains the source of truth.
- Redis remains disposable/rebuildable acceleration.
- Redis failure must never be treated as data absence.
- Do not migrate away from ioredis or introduce another Redis product/service.
- Do not redesign media `getAll` SCAN or add a malformed-key migration.
- Do not deploy to production.

## Review Focus

- Pipeline registration versus physical command count: test exact N command accounting.
- Rejected pipeline exec: test separate unconfirmed count and unchanged fallback.
- Media key context: test exact `media:id:brandId` and no wildcard MGET.
- MGET fallback cardinality: test N requested keys produce N nulls and DB recovery.
- Cart same-count/different-membership: test identity comparison, not count-only validation.

### Task 1: REN-238 Redis observability

**Files:** Modify `src/lib/redis/connection-policy.ts`, `src/lib/redis/index.ts`, and narrowly scoped cache method entry points; test `src/lib/redis/index.test.ts` and any new observability unit test.

- [ ] Add failing tests for direct family counts, pipeline N-count, rejected exec unconfirmed count, AsyncLocalStorage attribution, sensitive-field exclusion, and fail-open behavior.
- [ ] Run the targeted tests and confirm they fail for the missing behavior.
- [ ] Implement the aggregate hook in the existing Proxy and inner pipeline Proxy; wrap `criticalRedis` with the same hook while preserving return/fallback behavior.
- [ ] Run targeted tests and then the Redis test set.

### Task 2: REN-239 media cache resilience

**Files:** Modify `src/lib/redis/connection-policy.ts`, `src/lib/redis/methods/media.ts`, and only callers needed to provide exact brand context; test connection policy and media cache behavior.

- [ ] Add failing tests for N-null MGET fallback, exact canonical keys, no wildcard MGET, matching remove key, and 24-hour TTL.
- [ ] Run the targeted tests and confirm they fail for the missing behavior.
- [ ] Implement canonical key helpers, exact-key reads, shared MGET fallback cardinality, explicit invalidation preservation, and 24-hour TTL writes.
- [ ] Run targeted media tests and typecheck.

### Task 3: REN-240 cart cache index

**Files:** Modify `src/lib/redis/methods/cart.ts` and narrowly scoped mutation callers if ordering is not already guaranteed; test cart cache behavior.

- [ ] Add failing tests for indexed reads, no KEYS/SCAN hot reads, membership mismatch rebuild, variants, Redis failure, paired pipeline writes, and DB-first mutation ordering.
- [ ] Run the targeted tests and confirm they fail for the missing behavior.
- [ ] Implement `cart:index:${userId}`, exact compound item members, paired SET/DEL plus SADD/SREM, DB membership comparison, and rebuild path while preserving seven-day item TTL.
- [ ] Run targeted cart tests and typecheck.

### Task 4: Verification and handoff

- [ ] Run `bun run governance:validate --` for all three work-item YAML files.
- [ ] Run the full `bun test` suite and record every result.
- [ ] Run the repository type/lint checks used by CI if available.
- [ ] Review the final diff for exact changed files, scope deviations, and no production deployment.
