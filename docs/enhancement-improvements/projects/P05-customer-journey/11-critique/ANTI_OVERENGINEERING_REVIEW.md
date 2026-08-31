# Anti-Overengineering Review — P05 Customer Journey & UX

Per `docs/enhancement-improvements/PORTFOLIO_ANTI_OVERENGINEERING.md`'s program-wide standard, applied to this Epic.

## Where overengineering risk is real
- **REN-144**: risk of over-building a general-purpose "distributed transaction saga" framework when a single-database `db.transaction()` plus a purpose-built reconciliation record fully addresses the evidenced problem (all writes are to the same Postgres instance — this is not a distributed-systems problem requiring saga orchestration, compensating transactions across services, or an event-sourcing rearchitecture). Recommend explicitly against any of these heavier patterns unless a future V2 trigger (order-then-pay, `10-roadmap/V2.md`) changes the problem shape.
- **REN-95**: risk of over-building guest identity as a full "anonymous user account system" with its own profile/preferences/history when the evidenced need is narrower (complete one purchase without an account). Recommend the decision-makers scope the guest-identity mechanism (FR-2.3) to exactly what's needed for one order, not a parallel account system.
- **AI/MCP for this Epic**: explicitly NOT APPLICABLE (see `07-feasibility/FEASIBILITY_ASSESSMENT.md`) — flagged here again because "customer journey" epics are a common place well-meaning teams reach for personalization/ML by default. Nothing in this Epic's evidenced defects calls for it.

## Where the opposite risk (under-engineering) is more likely
- Treating REN-144 as "just add a transaction" (see `11-critique/FEASIBILITY_CRITIQUE.md`) under-addresses the client-disappears-mid-callback gap.
- Treating REN-152's consolidation as optional cleanup rather than a prerequisite for reliably fixing REN-161-style cross-cutting questions in the future.

## Verdict
This Epic's evidenced scope is correctly sized as fixes to existing functionality (see `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md`). No item warrants new infrastructure, a new service, or a new platform capability.
