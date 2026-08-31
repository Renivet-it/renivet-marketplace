# Feasibility Assessment — P05 Customer Journey & UX

## REN-144 (transaction boundary + reconciliation) — HIGH feasibility
Wrapping the per-item order-creation loop in `db.transaction()` is a well-understood, contained change to one file (`orders.ts`). The harder part is not the transaction itself but (a) deciding the reconciliation-record contract (FR-1.3) and (b) resolving the webhook-vs-client-path relationship (FR-1.5), both DECISION REQUIRED / research items rather than implementation-hard. No blocking unknowns beyond implementation effort and design decisions the team can make directly (no external dependency, no other team's sign-off structurally required, unlike REN-95).

## REN-95 (guest checkout) — LOW feasibility until 6 decisions resolve
Not a code-complexity problem — the three layers (route, tRPC, schema) are each individually straightforward — but a coordination and product/security/finance decision problem. This is why it is BLOCKED, not just large. Feasibility of the code change itself is MEDIUM (three coordinated layers, migration risk on the NOT NULL constraint); feasibility of the *decision* is UNKNOWN and outside engineering's control.

## REN-152 (consolidation) — MEDIUM feasibility
Refactoring three duplicated implementations into one shared module is mechanically straightforward but carries regression risk precisely because there is no automated test coverage on this path today (REN-101, cross-referenced). Recommend pairing any consolidation work with the minimum regression tests called for in NFR-6 before merging, not after.

## REN-153 (cart availability) — HIGH feasibility
The predicate already exists; this is presentation work (surface an existing computed value earlier in the flow) plus a shared-selector extraction. Low risk, high clarity.

## REN-161 (disclosure) — HIGH feasibility once FR-5.1 (determine actual server rule) resolves
The blocking step is a short investigation (read `coupons.validateCoupon`), not implementation. Should not have been scoped as effort-heavy; the underlying investigation is a half-day task.

## REN-163 (redirect) — HIGH feasibility
Small, contained change threading existing query-param context into an existing callback.

## AI/MCP feasibility — NOT APPLICABLE
This Epic is a correctness and consolidation problem (atomicity, authorization-layer consistency, honest disclosure, presentation-timing of existing logic), not a prediction, ranking, generation, or personalization problem. None of REN-144, REN-95, REN-152, REN-153, REN-161, or REN-163 have any dimension where a model would replace or augment logic — they are bugs and architectural gaps in deterministic business logic. Applying AI/MCP tooling here would be solving a problem that doesn't exist while leaving the actual (deterministic, well-specified) defects unaddressed — see `11-critique/ANTI_OVERENGINEERING_REVIEW.md`.
