# REN-160 — Cache personalized recommendation computation results

## Outcome

Avoid repeating expensive personalized recommendation queries for identical user/request contexts while preserving ranking, fallback, and anonymous behavior.

## Design

- Add a dedicated recommendation Redis cache with a 180-second TTL.
- Key format is versioned and includes `userId`, `limit`, and a stable SHA-256 digest of sorted/deduplicated `excludeProductIds`. This prevents cross-context results and bounds key length.
- Cache only healthy, useful final results: at least five products and a source other than `platform_defaults`. Empty/default degraded fallbacks are never cached. A partial merged result with at least five products may be cached as an accepted bounded quality trade-off.
- Store an envelope containing schema version, owner user ID, context fingerprint, and `RecommendationResult`. Validate owner/context and JSON with the existing product schema plus strict source/metadata schema. Malformed, mismatched, or stale-shape values are deleted and treated as misses. No data beyond the result already returned to that user is added.
- Read cache only for authenticated users. Anonymous platform defaults remain unchanged.
- On a miss, execute the existing recommendation path unchanged and best-effort write the result with `EX 180`.
- Cache get/set/delete operations have a 100 ms application budget and contain synchronous throws, rejected commands, parse failures, and validation failures. Redis remains fail-open and database behavior is unchanged.
- Coalesce concurrent misses for the same key with an in-process single-flight map and guaranteed cleanup. Cross-instance duplicate computation is explicitly accepted; a distributed lock is disproportionate for this short optimization cache.
- Structure the entry point as public cached method -> private uncached computation. Anonymous bypass occurs before cache access, and the existing broad fallback remains around the uncached computation.
- Do not add eager invalidation in this task. Signal windows already tolerate far more staleness than 180 seconds; expiry refreshes updated signals.

## Scope

Expected implementation paths:

- `src/lib/redis/methods/recommendation.ts`
- `src/lib/redis/methods/index.ts`
- `src/lib/db/queries/recommendation.ts`
- focused tests beside the new cache/query contract

No scoring, weighting, SQL, schema, payment, or UI changes are allowed.

## Verification

- Same user/context hits cache and avoids recomputation.
- Different user, limit, or exclusions cannot share entries.
- Exclusion order/duplicates normalize to the same key.
- TTL is exactly 180 seconds.
- Corrupt cache data and Redis failures execute the current database path.
- Empty/platform-default results are not cached; useful non-default results containing at least five products are cacheable.
- Concurrent identical misses in one process execute one computation and always clear single-flight state.
- Cache operation delay is bounded to 100 ms per get, set, or delete.
- Anonymous requests bypass this personalized cache.
- Cold-path output remains identical to current behavior.
- Run focused tests, full `bun test`, formatting/static checks, governance validation, and post-implementation review.

## Rollout

No configuration or migration is required. Standard code revert removes caching. Post-deployment monitoring should establish hit rate and watch recommendation error/latency signals.
