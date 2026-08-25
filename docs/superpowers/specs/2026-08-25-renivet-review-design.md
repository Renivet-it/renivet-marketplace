# Renivet REVIEW Governance Design

## Goal

Add a repository-local Codex skill invoked as `$renivet-review <LINEAR-ID>`. It reviews an implemented task against its already-approved SPEC contract and current Git diff, then writes evidence-backed task-local review artifacts without changing application behavior.

## Scope and boundaries

- The skill is read-only with respect to application code, schemas, production data/configuration, Linear state, and PR merge state.
- It may create or update only `docs/.work-items/<ID>/REVIEW.md` and the existing `work-item.yaml` review section.
- It consumes the existing SPEC contract; it never reconstructs a missing contract or rewrites approved intent to match implementation.
- It is an implementation-consistency check, not a replacement for human code review or `/TEST` execution.

## Developer experience

```text
$renivet-review REN-123
```

The skill will:

1. Confirm repository/branch state and retrieve the Linear issue using the configured connector.
2. Load `work-item.yaml` and the relevant SPEC, scenario, invariant, flow, architecture, and Critic artifacts.
3. Stop with `SPEC_CONTRACT_MISSING` if the work item is absent, invalid, or not approved/`READY_FOR_DEV`.
4. Determine an explicit Git base from PR metadata when available; otherwise use the merge base with the tracked base branch. Inspect the resulting diff progressively.
5. Reconcile requirements, scenarios, invariants, flows, architecture, security boundaries, integrations, failure handling, tests, and scope against the implementation.
6. Record the review result in Markdown and YAML; return `REVIEW_PASSED`, `REVIEW_PASSED_WITH_FINDINGS`, `REVIEW_FAILED`, or `REVIEW_BLOCKED`.

## Contract extension

`work-item.yaml` retains its existing optional `implementation_review` field and receives this normalized shape after a review:

```yaml
implementation_review:
  artifact: REVIEW.md
  result: REVIEW_PASSED
  base_branch: master
  base_commit: <40-character-sha>
  head_commit: <40-character-sha>
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
    - Git diff compared master merge-base to current HEAD.
```

Allowed reconciliation values are `PASS`, `PARTIAL`, `FAIL`, and `NOT_APPLICABLE`. Allowed review results are `REVIEW_PASSED`, `REVIEW_PASSED_WITH_FINDINGS`, `REVIEW_FAILED`, and `REVIEW_BLOCKED`. Drift values are `NO_DRIFT`, `MINOR_DRIFT`, and `MATERIAL_DRIFT`.

The validator will require all fields when this object is present, require a safe task-local `REVIEW.md` artifact, require commit SHAs, validate reconciliation values, and fail a passed result containing material drift, blocking findings, or required actions. A material drift result requires governance re-entry and a non-ready work-item state.

## Review artifact

`REVIEW.md` follows the requested implementation-review structure: executive result, requirement/scenario/invariant reconciliation, architecture/security/drift/test review, stable finding IDs, attention-only decisions, and final recommendation. Evidence must cite changed files, functions, tests, or contract IDs; it must not claim test execution by `/REVIEW`.

## Skill and deterministic boundary

Create `.agents/skills/renivet-review/` with a concise entry skill and references for reconciliation and Markdown output. Add a root `AGENTS.md` entry explaining when to invoke it.

AI performs Linear retrieval, diff interpretation, progressive surrounding-code inspection, security/quality reasoning, reconciliation, and finding severity. The Bun validator and GitHub workflow enforce only review-result structure, stable values, artifact safety/existence, drift fail-closed behavior, and changed-contract validation. The workflow remains advisory and does not create comments, labels, or required checks.

## Testing and pilot

Add Bun unit tests and fixtures for a valid review result plus rejection of missing fields, invalid status/reconciliation, unsafe/missing REVIEW artifact, passed-with-material-drift, and passed-with-blocking-actions. Extend the existing validator rather than creating a second tool.

Run a real non-destructive pilot only when a Linear task has both an approved work item and an actual implementation diff. The current repository contains no such committed task-local contract on `master`; the pilot will remain explicitly blocked until a qualifying feature branch is supplied. No synthetic evidence will be created.

## Files

- Modify: `AGENTS.md`
- Create: `.agents/skills/renivet-review/SKILL.md`
- Create: `.agents/skills/renivet-review/agents/openai.yaml`
- Create: `.agents/skills/renivet-review/references/{reconciliation,review-output}.md`
- Modify: `.agents/skills/renivet-spec/references/work-item-contract.md`
- Modify: `scripts/governance/{work-item-schema,validate-work-item,validate-work-item.test}.ts`
- Create: review-specific validator fixture and `REVIEW.md` fixture
- Optionally modify: `.github/workflows/governance.yml` only if its changed-contract path needs no semantic logic and can reuse the validator unchanged
- Create: `CODEX_REVIEW_IMPLEMENTATION_REPORT.md`

No `src/`, QA, migration, schema, or production file changes are in scope.
