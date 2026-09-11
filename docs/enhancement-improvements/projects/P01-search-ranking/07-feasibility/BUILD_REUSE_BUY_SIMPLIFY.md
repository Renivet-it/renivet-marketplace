# Build / Reuse / Buy / Simplify — P01

| Fix | Verdict | Rationale |
|---|---|---|
| REN-146 timeouts | REUSE EXISTING | `axios` already supports a `timeout` option natively; native `fetch` supports `AbortSignal.timeout()`. No new library needed. |
| REN-146 endpoint config | SIMPLIFY | Remove dead commented-out env-override code and hardcoded IP literal; replace with one real env var already partially wired (`EMBEDDING_SERVICE_URL` exists but is ignored) — this is deletion of confusion, not new build. |
| REN-149 redirect reconnect | SIMPLIFY | Delete the bug (use data already computed and already flowing to the client) — nothing to build. |
| REN-151 parallelize | REUSE EXISTING | `Promise.all`, already used elsewhere in the same file (`findMany` + `count`, REN-83) — same pattern, same file, proven approach. |
| REN-154 click/result logging | BUILD SMALL | A genuinely new (small) write path is needed — implement `logSearchClick`'s body and thread a result count through. No existing mechanism to reuse for this specific gap. |
| REN-155 count consistency | BUILD SMALL or SIMPLIFY (pick one, see `99-final/OPEN_DECISIONS.md`) | Either move the validity check into the SQL `hasMedia` predicate (SIMPLIFY — one predicate change) or recompute `count` after the app-level filter (BUILD SMALL — a second lightweight query or in-memory reconciliation). Both are small; recommend the SQL-predicate approach if media-URL validity can be expressed in SQL, else the recompute approach. |
| REN-156 remove dead client | SIMPLIFY | Pure deletion. |
| REN-158 skip redundant ILIKE | SIMPLIFY | Reorder an existing conditional; no new code beyond an `if`. |
| REN-159 category listing cache | REUSE EXISTING | Same Redis client and caching pattern already used for `mediaCache` — extend the pattern, don't introduce a new caching technology. |
| REN-148 staged sync-cadence step | BUILD SMALL (staged) or non-code (a scheduling/ops decision) | Likely mostly a process/runbook decision plus a minimal confirmation script, not a data pipeline. Full BUY (e.g. a third-party search-sync product) is not warranted at this stage — see `07-feasibility/ALTERNATIVES.md`. |

## What was explicitly rejected as overkill

- Building a new caching framework for REN-159 — Redis already exists and is already used for the same kind of read-through caching (`mediaCache`); introducing a second cache technology (e.g. in-memory LRU, CDN-level caching) would be unwarranted complexity for a Redis shop.
- Building a circuit-breaker library for REN-146 — a plain timeout with existing try/catch fallback is sufficient given the failure modes observed (see `08-reliability/FAILURE_MATRIX.md`); a full circuit-breaker (half-open states, failure-rate windows) is not justified by any evidence of cascading-failure risk found in this pass.
- Building a new full-text search index (Postgres `tsvector`/GIN) to replace ILIKE — technically available (commented-out dead code already references it) but out of this Epic's stated scope; REN-158's fix reduces how often ILIKE runs at all, which is a cheaper first step than indexing a fallback path meant to be rarely hit once RAG/timeouts are healthy.
