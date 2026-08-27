# REN-140 Specification

## Goal

Make the shared ioredis client bounded and serverless-appropriate by explicitly configuring connection timeout, bounded reconnect behavior, and command retry behavior, while preserving the existing Redis-backed behavior and preventing Redis instability from causing disproportionate request latency.

## Evidence and scope

- `src/lib/redis/index.ts:4` constructs `new Redis(env.REDIS_URL)` with library defaults only.
- `src/lib/redis/methods/*.ts` is the shared access layer; it uses reads, writes, pipelines, key scans, counters, and revenue/analytics storage.
- Callers include public marketing pages, authenticated dashboard/context creation, tRPC routes, finance/reporting routes, payment/refund webhooks, shipping webhooks, and cron/reporting paths.
- `src/lib/trpc/context.ts:129` awaits `userCache.get()` during authenticated context creation.
- `src/lib/redis/methods/user.ts:14-24` and `src/lib/redis/methods/cart.ts:63-95` await Redis reads without a shared catch/fallback boundary.
- The Linear issue reports Vercel `connect ETIMEDOUT` errors and TLS-handshake disconnects, and identifies Upstash serverless guidance as the intended source for values.

The implementation scope is the shared client configuration plus the minimum failure-handling and regression coverage required by the approved policy decision. It must not change Redis key formats, TTLs, business calculations, authentication decisions, payment state, order state, or provider credentials.

## Approved failure policy

The owner approved the following policy: cache reads fall back to their existing database path, cache writes are best-effort, authenticated context hydration falls back to the database without bypassing authorization, Shiprocket token lookup treats a cache failure as a miss and obtains a fresh token, and analytics/revenue failures remain visible to their callers rather than being silently discarded.

## Acceptance criteria

- The Redis client has explicit, bounded `connectTimeout`, `retryStrategy`, and `maxRetriesPerRequest` settings sourced from the approved design.
- Connection failures are logged through the client error listener.
- Reconnect attempts and command retries are finite; no unbounded serverless retry loop is introduced.
- The chosen Redis failure policy is preserved for cache reads, cache writes, analytics, revenue tracking, Shiprocket token caching, and request-context hydration.
- Existing cache keys, TTLs, data formats, authentication behavior, payment/refund behavior, and order behavior remain unchanged.
- Tests cover timeout/retry configuration and the selected failure behavior, including an unavailable Redis endpoint and a recovered endpoint where applicable.
- Post-deployment Vercel queries are rerun for `connect ETIMEDOUT` and TLS-handshake disconnect signatures.

## Verification

Run the focused Redis tests, `bun test`, and `bun run build` after the decision is resolved. Review the diff for scope. Compare pre/post Vercel runtime error rates and request latency for the affected routes.
