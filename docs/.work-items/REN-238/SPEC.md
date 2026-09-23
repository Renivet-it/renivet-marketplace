# REN-238 — Redis Observability

## Goal

Measure physical Redis work by cache domain without changing cache behavior or exposing keys, payloads, or per-command events.

## Scope and design

- Extend the existing best-effort Redis Proxy and its inner pipeline Proxy.
- Count direct commands when invoked and count each command registered on a pipeline by command family.
- `pipeline()` and `exec()` are control operations, not physical command counts. A rejected `exec()` records a separate unconfirmed count.
- Apply the same counting hook to raw `criticalRedis` used by analytics/revenue.
- Preserve AsyncLocalStorage attribution and existing Vercel-visible console logging; aggregate to one bounded log record per observation scope.
- Instrumentation is fail-open and emits no keys, values, payloads, or per-command stream.
- Aggregate records contain only `route`, `cacheDomain`, `hitMiss`, `commandCounts`, `unconfirmedCommandCounts`, `env`, and `deploymentId`; command families are normalized to lowercase Redis method names with an `unknown` bucket, and one record is emitted per AsyncLocalStorage observation scope.
- Redis error logs serialize only a fixed error marker/type; raw error objects and command arguments are never passed to the logger.

## Decisions

- 100% aggregation is retained because the ticket requests a cost baseline and the existing logger is already sampled/managed outside this cache layer; no new sampling policy is introduced.
- Existing fallback values and error logging remain unchanged.

## Required test evidence

- Direct commands are grouped by command family.
- A pipeline with N registered commands reports N physical commands and excludes pipeline/exec.
- A rejected exec reports the registered commands as unconfirmed separately.
- AsyncLocalStorage labels are preserved and logs contain only approved metadata.
- Instrumentation errors never alter the Redis result or cache fallback.
