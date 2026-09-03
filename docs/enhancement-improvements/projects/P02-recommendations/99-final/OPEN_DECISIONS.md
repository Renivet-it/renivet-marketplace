# Open Decisions — P02

Consolidated list of every DECISION REQUIRED item raised throughout this package, with pointers back to full context.

1. **REN-147 fallback tier ordering** — keep the existing same-host vector-search fallback as a middle tier before the new independent Postgres fallback, or replace it entirely? (`05-algorithms/DECISION_LOGIC.md`)
2. **REN-147 config fix approach** — make `EMBEDDING_SERVICE_URL` authoritative, or remove the dead env-var read entirely? (`03-requirements/FUNCTIONAL_REQUIREMENTS.md` FR-1.4)
3. **REN-150 ranking scheme** — true position-preserving `CASE` ordering (recommended) vs. coarser N-tier bucketing? (`05-algorithms/TARGET_ALGORITHM.md`, `DECISION_LOGIC.md`)
4. **REN-160 cache mechanism** — `unstable_cache` vs. Redis-based cache-module pattern (`userCartCache`-style), for each of the two cache insertion points? (`07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md`)
5. **REN-160 TTL values** — proposed 1-6 hours (product-keyed, Placements A/B) and 5-15 minutes (user-keyed, Placement C) are starting proposals, not validated against real staleness-tolerance data. (`03-requirements/NON_FUNCTIONAL_REQUIREMENTS.md` NFR-4, `08-reliability/FAILURE_MATRIX.md` Scenario 5)
6. **REN-160 cache content** — cache raw ID lists (safer, requires re-hydration read) vs. fully hydrated results (faster, more staleness risk)? (`08-reliability/FAILURE_MATRIX.md` Scenario 3)
7. **REN-165 verification method** — confirm Phase 1's specific approach (survey vs. analytics review vs. comparable-pattern research, or a combination) with whoever owns product/analytics decisions. (`09-validation/EXPERIMENT_STRATEGY.md`)
8. **REN-168 "demonstrated need" definition** — this package proposes a specific evidentiary bar (co-purchase pattern analysis + conversion hypothesis); needs ratification or replacement by whoever owns this Epic's prioritization. (`10-roadmap/VERSION_TRIGGERS.md`)
9. **`getShopRecommendations` procedure status** — confirm whether it's genuinely unused (candidate for removal) or has an uncovered caller, before REN-160 implementation targets the wrong code path. (`11-critique/ARCHITECTURE_CRITIQUE.md` #2)
10. **New tracked issue for recommendation impression/click instrumentation?** — a real gap surfaced repeatedly (REN-160/165's measurement blind spot) but is not itself one of the six tracked issues; decide whether to open a new issue or fold it into REN-165's Phase 2 scope if that proceeds. (`10-roadmap/V2.md`)

None of the above block starting V1 implementation — each is a within-implementation choice or a downstream/adjacent question, not a precondition for beginning REN-147/150/157/160 work.
