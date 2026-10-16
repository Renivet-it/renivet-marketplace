# REN-253 C0 Payout Containment

Status: `IN_REVIEW`

This specification is the governance contract for the bounded C0 containment change. It does not authorize payout clearance or execution.

## Requirements

- REQ-253-001: Missing commission policy must fail closed; no unapproved fallback may produce a payout amount.
- REQ-253-002: Recalculation must be allowed only for `draft` and `calculated` cycles.
- REQ-253-003: Payout statements must require existing finance payout view/manage access or site-admin inheritance.
- REQ-253-004: Payout execution must enforce clearer/executor separation and stable cycle-and-brand replay protection.
- REQ-253-005: RTO `faultOwner` changes must use one lock-aware audited authority.
- REQ-253-006: No payout may be cleared or executed by this work.

## Scenarios

- SCN-253-001: Missing or unapproved commission rule produces an explicit blocked/unconfigured result.
- SCN-253-002: Draft/calculated cycles recalculate; approved/processing/completed/failed cycles are rejected before mutation.
- SCN-253-003: Statement access permits only authenticated payout-finance viewers/managers or site Admin users.
- SCN-253-004: Same-actor clearance/execution and repeated cycle-and-brand execution are rejected or deduplicated.
- SCN-253-005: Unlocked authorized RTO attribution succeeds with audit evidence; locked attribution fails.
- SCN-253-006: No test or release action mutates production money or executes a payout.

## Invariants

- INV-253-001: No missing commission rule silently becomes a numeric rate.
- INV-253-002: Approved or later payout-cycle states cannot be recalculated.
- INV-253-003: An unauthorized statement request cannot read payout data.
- INV-253-004: One cycle-and-brand payout reference cannot create two effective payouts.
- INV-253-005: Locked RTO attribution cannot be changed outside the audited authority.
- INV-253-006: REN-253 never clears or executes a payout.

## Dependencies and decisions

- DEP-253-001: Existing REN-203 commission decision; resolved in Linear.
- DEP-253-002: Existing finance module access and site-admin inheritance; resolved by repository evidence.
- DEP-253-003: Akshay release decision and Ayan read-only deployment/migration evidence; resolved in Linear.
- DEC-253-001: Recalculation state set; approved.
- DEC-253-002: Statement access rule; approved.
- DEC-253-003: Cycle-and-brand replay reference; approved.
- DEC-253-004: Canonical RTO attribution path; approved.

## Test expectations

- TEXP-253-001: Unit/regression tests for commission fail-closed behavior.
- TEXP-253-002: Unit/integration tests for all six payout-cycle statuses.
- TEXP-253-003: API/security tests for statement authentication and finance authorization.
- TEXP-253-004: Unit/integration tests for separation and duplicate execution.
- TEXP-253-005: API/security tests for locked and audited RTO attribution.
- TEXP-253-006: Regression suite with no production provider or production database mutation.

## Approval gate

Design review is pending. The task must not move to `READY_FOR_DEV` until the written design and independent L3 Critic review are complete, the governance YAML validates, and no design blockers remain.
