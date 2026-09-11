# Anti-Overengineering Review — P01

Cross-referenced against `../../PORTFOLIO_ANTI_OVERENGINEERING.md`'s program-level discipline.

## Overengineering risks identified and rejected in this package

| Temptation | Where it could creep in | Why rejected |
|---|---|---|
| Build a new ranking model / ML pipeline | Anywhere in `05-algorithms/` | No evidence of a ranking-quality problem exists (no data yet — that's REN-154's job to produce). See `07-feasibility/FEASIBILITY_ASSESSMENT.md`. |
| Build a circuit-breaker library for REN-146 | `08-reliability/FAILURE_MATRIX.md` | Plain timeout + existing fallback already covers every observed failure mode; no cascading-failure evidence found. |
| Build a full reconciliation pipeline for REN-148 | `07-feasibility/ALTERNATIVES.md` Option B | Explicitly out of scope per the incoming brief; no evidence of the external ingestion contract needed to build it responsibly. |
| Replace the external microservice with owned pgvector search | `07-feasibility/ALTERNATIVES.md` Option C | No product-owner decision to own search exists; would require rebuilding opaque ranking logic Renivet doesn't currently understand. |
| Build dashboards/alerting/anomaly detection alongside REN-154 | `08-reliability/OBSERVABILITY.md` | No baseline metrics exist yet to alert against — building alerting infra before there's a signal is the textbook overengineering failure mode. |
| Refactor `getProducts()`'s overall 600+ line structure while fixing REN-151/155/158 | `11-critique/ARCHITECTURE_CRITIQUE.md` | Named explicitly as tempting but out of scope — much higher risk than the actual fixes, deserves its own initiative if ever pursued. |
| Introduce a new caching technology for REN-159 | `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md` | Redis is already the established pattern (`mediaCache`) — reuse, don't diversify infrastructure. |
| Add typo tolerance (REN-167) speculatively alongside V1 | `10-roadmap/V2.md` | Explicitly deferred by the portfolio; gated on data that doesn't exist. |

## Where this package itself risked overbuilding, and how it was scoped down

- Considered proposing a shared HTTP-client utility to centralize the timeout/config fix across all 5 call sites (`11-critique/ARCHITECTURE_CRITIQUE.md`) — kept as a *recommendation*, not a requirement, because forcing a shared abstraction across P01- and P02-owned files could expand this Epic's blast radius into P02's territory without coordination. The FUNCTIONAL_REQUIREMENTS document states the timeout/config fix per-call-site as the actual requirement; consolidation is optional polish, not mandatory scope.
- Considered specifying an exact cache TTL and invalidation strategy for REN-159 — left as an open decision (`99-final/OPEN_DECISIONS.md`) rather than inventing a specific number with no traffic data to justify it.

## Conclusion

This Epic's backlog, as scoped by the portfolio-governance pass, already reflects good anti-overengineering discipline (nine small deterministic fixes, one explicit deferral). This documentation pass's job was to verify that discipline against source code, not to add scope — and it found no case where the existing scope should be expanded, and several cases (above) where a natural-seeming expansion should be explicitly resisted.
