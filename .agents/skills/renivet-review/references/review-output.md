# Review output

## REVIEW.md structure

Use these headings exactly and in this order:

```markdown
# REVIEW: <LINEAR-ID> — <title>

## Executive Result

## Review Scope and Git Evidence

## Requirement Reconciliation

## Scenario Reconciliation

## Invariant Reconciliation

## Flow and Architecture Review

## Security and Integration Review

## Scope and Drift Review

## Test Expectation Review

## Findings

## Decisions Requiring Attention

## Final Recommendation
```

The executive result states the result, drift, base/head commits, and whether governance re-entry is required. Reconciliation sections cover every stable contract ID or an evidenced `NOT_APPLICABLE` reason. The final recommendation repeats blockers and required actions without introducing new findings.

## Finding records

Assign stable IDs in discovery order and preserve the ID when the same finding survives a rerun. Do not create placeholder findings. Each finding uses exactly these fields:

```markdown
### REV-001

- Severity: BLOCKER | HIGH | MEDIUM | LOW
- Category: requirement | scenario | invariant | architecture | security | integration | scope | test | drift | decision
- Description: <concise observed mismatch or risk>
- Evidence: <contract IDs plus file/symbol/hunk/commit evidence>
- Impact: <behavioral, security, operational, or delivery consequence>
- Recommendation: <specific follow-up; no code fix performed by REVIEW>
```

When there are no findings or attention decisions, write `None.` under the respective heading. `blocking_findings` and `required_actions` in YAML contain stable finding IDs with concise text, for example `REV-001: Authorization invariant is not enforced.`

## Normalized YAML result

Replace the optional `implementation_review` object with this exact shape:

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
        test_coverage: PARTIAL
        scope: PASS
    blocking_findings: []
    required_actions: []
    evidence:
        - Compared the approved contract with the recorded base-to-head Git diff.
    governance_reentry_required: false
```

Rules:

- `artifact` is the safe task-local relative path `REVIEW.md`, and that regular file must exist before validation.
- `result` is `REVIEW_PASSED`, `REVIEW_PASSED_WITH_FINDINGS`, `REVIEW_FAILED`, or `REVIEW_BLOCKED`.
- `base_branch` is non-empty; commits are exact 40-character hexadecimal SHAs; `pr_url` is a string or `null`.
- `material_drift` is `NO_DRIFT`, `MINOR_DRIFT`, or `MATERIAL_DRIFT`.
- Every reconciliation field is `PASS`, `PARTIAL`, `FAIL`, or `NOT_APPLICABLE`. Do not add an integration reconciliation key; document it in REVIEW.md and aggregate it into architecture/security.
- Findings and actions are arrays, including when empty. Evidence is a non-empty string array.
- `REVIEW_PASSED` is consistent only with `NO_DRIFT`, empty blockers/actions, all applicable reconciliation fields `PASS`, evidenced non-applicable fields, and no findings. Use `REVIEW_PASSED_WITH_FINDINGS` for non-blocking findings, partials, actions, or minor drift.
- `MATERIAL_DRIFT` requires `governance_reentry_required: true`, `REVIEW_FAILED`, and local `task.status` changed from `READY_FOR_DEV` to `IN_REVIEW` or `BLOCKED`. Use `false` for non-material results.

## Lifecycle

Create or update one current `docs/.work-items/<ID>/REVIEW.md` on the feature branch only after the approved-contract gate passes. Keep `implementation_review.artifact: REVIEW.md` synchronized with that file and refresh the artifact plus base/head/evidence on each rerun; Git history preserves prior reviews. Commit it with the task-local work item when requested. Like the other task-specific governance artifacts, it must not remain on the default branch after the PR lifecycle completes.
