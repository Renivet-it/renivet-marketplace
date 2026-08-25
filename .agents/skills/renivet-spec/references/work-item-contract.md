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

## Normalized implementation review

`implementation_review` remains optional before implementation review. When present, use the normalized validator shape:

```yaml
implementation_review:
    artifact: REVIEW.md
    result: REVIEW_PASSED
    base_branch: main
    base_commit: "0000000000000000000000000000000000000000"
    head_commit: "1111111111111111111111111111111111111111"
    pr_url: null
    material_drift: NO_DRIFT
    reconciliation:
        requirements: PASS
        scenarios: PASS
        invariants: PASS
        architecture: PASS
        security: NOT_APPLICABLE
        test_coverage: PASS
        scope: PASS
    blocking_findings: []
    required_actions: []
    evidence:
        - Compared the approved contract with the recorded base-to-head Git diff.
    governance_reentry_required: false
```

The result is `REVIEW_PASSED`, `REVIEW_PASSED_WITH_FINDINGS`, `REVIEW_FAILED`, or `REVIEW_BLOCKED`. Each reconciliation field is `PASS`, `PARTIAL`, `FAIL`, or `NOT_APPLICABLE`. `base_branch` and evidence are non-empty, base/head commits are 40-character hexadecimal SHAs, `pr_url` is a string or `null`, and findings/actions are arrays even when empty. The artifact must be a safe task-local relative path to an existing regular file.

`REVIEW_PASSED` requires `NO_DRIFT` with empty blocking findings and required actions; use it only when every applicable reconciliation category passes and all other categories have evidenced non-applicability. Use `REVIEW_PASSED_WITH_FINDINGS` for non-blocking findings, partial reconciliation, required follow-up, or minor drift. Material drift requires `governance_reentry_required: true`, a non-ready task status, governance re-entry, and a non-passing review result. Use `governance_reentry_required: false` otherwise.

## REVIEW.md lifecycle

`REVIEW.md` is the human-readable implementation-review artifact named by `implementation_review.artifact`. Create or refresh it only after validating an approved `READY_FOR_DEV` contract, keep it beside `work-item.yaml` on the feature branch, and update its base/head/evidence with each review rerun. The artifact and YAML result move together through review and validation. Task-specific governance artifacts must not remain on the default branch after the PR lifecycle completes.
