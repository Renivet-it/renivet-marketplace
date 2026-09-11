# Open Decisions — P01

Every DECISION REQUIRED item raised across this package, centralized. None blocks starting work; each blocks *finishing* the named issue cleanly.

| # | Decision | Affects | Where discussed | Recommended default if no owner responds |
|---|---|---|---|---|
| 1 | Where should REN-154 log result count — bridged into the existing `logSearchQuery` call from Subsystem B, or logged separately at the point `getProducts()` (Subsystem A) resolves? | REN-154 | `06-data/DATA_REQUIREMENTS.md` | Log separately at `getProducts()` — avoids coupling the two subsystems further |
| 2 | Should REN-154 also log which candidate source won (RAG vs. ILIKE vs. exact-brand), beyond its literal title's scope? | REN-154, and REN-167's future evaluation | `05-algorithms/DECISION_LOGIC.md` | Yes — low incremental cost, otherwise REN-167 can never be responsibly evaluated later |
| 3 | Should REN-155 fix the count/data mismatch by moving media-validity into the SQL predicate, or by recomputing `count` after the app-level filter? | REN-155 | `05-algorithms/TARGET_ALGORITHM.md`, `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md` | Prefer SQL-predicate approach if media-URL validity is expressible in SQL against the Redis-hydrated media map; else recompute |
| 4 | What timeout duration should REN-146 use? | REN-146 | `03-requirements/NON_FUNCTIONAL_REQUIREMENTS.md`, `08-reliability/PERFORMANCE.md` | Pick conservatively now (low single-digit seconds); tune once REN-154's data exists |
| 5 | Does the external ML/search microservice support TLS? | REN-146 | `08-reliability/SECURITY.md` | Investigate with whoever owns the vendor relationship before assuming HTTP must stay |
| 6 | Who owns the operational relationship with the external microservice (SLA, uptime, contract)? | REN-146, REN-148 | `07-feasibility/RESOURCE_ASSESSMENT.md`, `08-reliability/FAILURE_MATRIX.md` | No default — genuinely needs a named human owner |
| 7 | What cache TTL and invalidation strategy should REN-159 use? | REN-159 | `03-requirements/ACCEPTANCE_CRITERIA.md` | Short TTL (minutes, not hours) with no forced invalidation on catalog change, pending real traffic data |
| 8 | Is `priorityProductIds`'s provenance always server-controlled (not raw user input)? | Adjacent to REN-151's code area | `08-reliability/SECURITY.md` | Confirm before touching that code; do not assume |
| 9 | What does "confirm/schedule sync cadence" concretely mean operationally for REN-148? | REN-148 | `07-feasibility/ALTERNATIVES.md` | A lightweight manual/scheduled confirmation step, not a pipeline — needs a named owner (see #6) |
| 10 | Should Renivet ever own search/ranking end-to-end instead of depending on the external microservice? | Long-term (V3-shaped) | `07-feasibility/ALTERNATIVES.md` Option C | No action now — revisit only if #6/#9's data shows recurring, unresolvable dependency risk |

**None of these decisions require pausing V1's start.** REN-149, REN-151, REN-156, REN-158 have zero open decisions and can begin immediately per `10-roadmap/V1.md`.
