# Dependencies — P01

## Within this Epic

| Issue | Depends on | Why |
|---|---|---|
| REN-151 | None (independent) | Pure control-flow change, no shared surface with other issues except general caution around `getProducts()`'s size |
| REN-158 | None (independent), but touches the same WHERE-clause construction as REN-151's surrounding code | Sequencing suggestion: do REN-151 and REN-158 in the same change or with care to avoid merge conflicts, not a hard dependency |
| REN-155 | None (independent) | Isolated to the `count()`/re-filter logic |
| REN-154 | Loosely benefits from REN-155 shipping first | A correct `count` makes REN-154's result-count logging meaningful; not a hard blocker, but sequencing REN-155 before REN-154 avoids logging a number about to change |
| REN-156 | None (independent) | Simple deletion; verify no other issue's implementation accidentally starts calling the dead file first |
| REN-159 | Benefits from REN-158 shipping first | Caching a query whose WHERE-clause construction is about to change is fine either order, but implementing REN-159 after REN-158 avoids caching soon-to-be-stale query shapes |
| REN-146 | None (independent), but is the highest-leverage single item | Recommended first per `10-roadmap/V1.md` given its shared benefit to P02 |
| REN-149 | None (independent) | Purely client-side; no server change needed |
| REN-148 | None within this Epic | Its "staged first step" scope is self-contained |
| REN-167 (deferred) | REN-146 | Explicitly gated — do not start until REN-146 ships and produces fallback-activation data |

## Cross-Epic

- **Shared with P02**: REN-146's client-side timeout/config pattern, if extracted into a shared HTTP-client utility, would benefit `product-recommendation.ts` too. This Epic should not silently modify P02-owned files as part of REN-146 without coordination — see `../../DEPENDENCY_GRAPH.md`.
- **Upstream from P08**: Catalog data completeness (what P08 governs) affects what `requireMedia` (REN-155) and the ILIKE fallback (REN-158) actually operate on — no action needed from P01, just an acknowledged upstream data-quality dependency already documented in `../../DEPENDENCY_GRAPH.md`.
- **Downstream to P06**: REN-154's logging is what P06 (measurement) would eventually consume — no P06 action is required for REN-154 to ship, but REN-154's schema choices should be sanity-checked against however P06 aggregates search data, if such a plan exists (UNKNOWN).

## External dependency

The external ML/search microservice itself — all of REN-146/148/167 are fixes *around* this dependency, not changes to it. Renivet has no control over its uptime, latency, or internal algorithm. See `08-reliability/FAILURE_MATRIX.md` for how this Epic treats that as a given constraint, not something to fix.
