# Work-item contract

`work-item.yaml` is the machine-readable contract. Use this top-level shape:

- `schema_version`
- `task`: ID, title, source, branch, status, and Linear metadata
- `risk`: initial, path-rule, semantic, final, reasons, and escalation history
- `investigation`: depth, investigated/excluded areas, dependencies, integrations, boundaries, transitions, tests, and uncertainties
- arrays for requirements, scenarios, invariants, flows, dependencies, integrations, personas, security boundaries, business rules, decisions, and test expectations
- `critic`: required/completed state, artifact, reviewer/fresh-context/read-only attestation, category coverage, and structured findings
- `approval`: approval state, explicit design blockers, and approver identity
- `traceability`: requirement-to-scenarios, scenario-to-invariants, and scenario-to-test-expectations
- optional `implementation_review`: drift classification, diff-based evidence, and governance re-entry flag

IDs are unique within each array. Every referenced ID must exist. Every requirement needs at least one scenario; every scenario needs at least one requirement and test expectation. Applicable invariants must be connected to scenarios.

Each test expectation has a category (`unit`, `component`, `api`, `integration`, `e2e`, `ui_ux`, `business_uat`, `security`, `accessibility`, `performance`, `regression`, `exploratory`, or `external_integration`), a classification (`REQUIRED`, `OPTIONAL`, or `NOT_APPLICABLE`), and a reason.

For `READY_FOR_DEV`, non-L0 contracts require requirements, scenarios, and test expectations. L2/L3 contracts additionally require invariants, flows, and an independent Critic attestation: non-empty artifact and reviewer, `fresh_context: true`, `read_only: true`, all required review categories, and a findings array (which may be empty). READY approval requires an explicit `design_blockers` array and a non-empty `approved_by` value.

After implementation, classify the actual Git diff against the approved contract as `NO_DRIFT`, `MINOR_DRIFT`, or `MATERIAL_DRIFT`. Material drift requires `governance_reentry_required: true` and a non-ready task state.

Allowed lifecycle states are `DRAFT`, `IN_REVIEW`, `BLOCKED`, and `READY_FOR_DEV`. A Class C decision uses `human_confirmation_required: true` and cannot remain unresolved in `READY_FOR_DEV`.
