# Renivet REVIEW Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repository-native `$renivet-review <LINEAR-ID>` skill that reconciles an approved SPEC contract with implementation evidence and records a validated task-local review result.

**Architecture:** The new review skill is a thin Codex orchestration layer that reads Linear, the existing work item, Git/PR diff evidence, and relevant tests. It writes `REVIEW.md` plus a structured `implementation_review` object to the same work item. The existing Bun validator becomes the sole deterministic enforcer of review-result structure and safe artifact paths; GitHub Actions continues to invoke that validator without semantic AI logic.

**Tech Stack:** Codex repository-local skills, TypeScript, Bun test, YAML, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-25-renivet-review-design.md`

## Global Constraints

- Do not modify `src/`, QA, schemas/migrations, production configuration/data, Linear workflow, or application behavior.
- Use Bun for dependency commands, tests, and validator execution.
- `/REVIEW` creates/updates only `docs/.work-items/<TASK-ID>/REVIEW.md` and `work-item.yaml`.
- Reuse the existing `implementation_review` field and `governance:validate` command; do not create a second schema or CI workflow.
- A real pilot requires a genuine task with an approved contract and implementation diff; report it as blocked if none is available.

---

### Task 1: Define deterministic implementation-review vocabulary and validator tests

**Files:**

- Modify: `scripts/governance/work-item-schema.ts`
- Modify: `scripts/governance/validate-work-item.test.ts`
- Modify: `scripts/governance/fixtures/valid-l2/work-item.yaml`
- Create: `scripts/governance/fixtures/valid-l2/REVIEW.md`

**Interfaces:**

- Consumes: existing `UnknownRecord`, `ValidationResult`, valid L2 fixture, and `implementation_review` field.
- Produces: exported review-result/reconciliation/drift constants and failing tests defining the contract expected from `validateWorkItem` and `validateWorkItemFile`.

- [ ] **Step 1: Add exported review constants**

Add to `work-item-schema.ts`:

```ts
export const REVIEW_RESULTS = [
    "REVIEW_PASSED",
    "REVIEW_PASSED_WITH_FINDINGS",
    "REVIEW_FAILED",
    "REVIEW_BLOCKED",
] as const;

export const RECONCILIATION_RESULTS = [
    "PASS",
    "PARTIAL",
    "FAIL",
    "NOT_APPLICABLE",
] as const;

export const IMPLEMENTATION_DRIFT_LEVELS = [
    "NO_DRIFT",
    "MINOR_DRIFT",
    "MATERIAL_DRIFT",
] as const;
```

- [ ] **Step 2: Write failing review-contract tests**

Extend the valid fixture with a complete review result and add tests that mutate it. The new tests must assert these codes:

```ts
expect(codes).toContain("GOV-REVIEW-001"); // missing result/base/head/reconciliation
expect(codes).toContain("GOV-REVIEW-001"); // unknown review or reconciliation value
expect(codes).toContain("GOV-REVIEW-001"); // REVIEW_PASSED plus blockers/actions/material drift
expect(codes).toContain("GOV-DRIFT-001");  // material drift without re-entry/non-ready state
expect(codes).toContain("GOV-REVIEW-001"); // unsafe or missing REVIEW.md artifact
```

Use a valid result with `artifact: REVIEW.md`, 40-character SHA placeholders, explicit empty `blocking_findings`/`required_actions`, and an `evidence` array. Add a minimal fixture `REVIEW.md` so file validation can pass.

- [ ] **Step 3: Run tests and verify the new assertions fail**

Run:

```powershell
bun test scripts/governance/validate-work-item.test.ts
```

Expected: the new review-contract tests fail because no normalized review validator exists yet.

- [ ] **Step 4: Commit the test contract**

```powershell
git add scripts/governance/work-item-schema.ts scripts/governance/validate-work-item.test.ts scripts/governance/fixtures/valid-l2
git commit -m "test: define implementation review contract"
```

### Task 2: Validate review results and task-local artifacts

**Files:**

- Modify: `scripts/governance/validate-work-item.ts`
- Modify: `scripts/governance/validate-work-item.test.ts`
- Modify: `scripts/governance/fixtures/valid-l2/work-item.yaml`
- Create: `scripts/governance/fixtures/valid-l2/REVIEW.md`

**Interfaces:**

- Consumes: `REVIEW_RESULTS`, `RECONCILIATION_RESULTS`, `IMPLEMENTATION_DRIFT_LEVELS`, `isSafeWorkItemArtifact`, and `validateWorkItemFile`.
- Produces: `GOV-REVIEW-001` errors for invalid review structure and file-level REVIEW artifact validation.

- [ ] **Step 1: Implement normalized review-field validation**

Replace the current minimal `implementation_review` handling with validation that requires, when the object exists:

```ts
artifact: string;               // safe relative task-local path
result: REVIEW_RESULTS[number];
base_branch: string;
base_commit: /^[0-9a-f]{40}$/i;
head_commit: /^[0-9a-f]{40}$/i;
pr_url: string | null;
material_drift: IMPLEMENTATION_DRIFT_LEVELS[number];
reconciliation: {
  requirements, scenarios, invariants, architecture,
  security, test_coverage, scope,
}; // each RECONCILIATION_RESULTS[number]
blocking_findings: string[];
required_actions: string[];
evidence: string[]; // non-empty
```

Use `GOV-REVIEW-001` for malformed/missing review fields. Reuse `GOV-DRIFT-001` only for material-drift governance re-entry semantics.

- [ ] **Step 2: Enforce pass/fail consistency**

Implement these deterministic rules:

```ts
const passed = review.result === "REVIEW_PASSED";
if (passed && (review.material_drift !== "NO_DRIFT" || blockers.length || actions.length)) {
  add(errors, "GOV-REVIEW-001", "implementation_review", "A passed review cannot contain drift, blockers, or required actions.");
}
if (review.material_drift === "MATERIAL_DRIFT" && review.governance_reentry_required !== true) {
  add(errors, "GOV-DRIFT-001", "implementation_review.governance_reentry_required", "Material drift requires governance re-entry.");
}
```

Require non-ready task state for material drift, preserving the existing fail-closed rule.

- [ ] **Step 3: Validate the `REVIEW.md` file at file-validation time**

In `validateWorkItemFile`, after YAML parsing, resolve `implementation_review.artifact` relative to the work-item directory only when `isSafeWorkItemArtifact` passes. Require it to exist as a file. Do not open or execute its content. Emit `GOV-REVIEW-001` if it is unavailable.

- [ ] **Step 4: Run focused tests and fixture validation**

Run:

```powershell
bun test scripts/governance/validate-work-item.test.ts
bun run governance:validate -- scripts/governance/fixtures/valid-l2/work-item.yaml
```

Expected: all focused tests and the valid fixture pass.

- [ ] **Step 5: Commit validator enforcement**

```powershell
git add scripts/governance
git commit -m "feat: validate implementation review results"
```

### Task 3: Add the repository-local REVIEW skill and contract documentation

**Files:**

- Modify: `AGENTS.md`
- Create: `.agents/skills/renivet-review/SKILL.md`
- Create: `.agents/skills/renivet-review/agents/openai.yaml`
- Create: `.agents/skills/renivet-review/references/reconciliation.md`
- Create: `.agents/skills/renivet-review/references/review-output.md`
- Modify: `.agents/skills/renivet-spec/references/work-item-contract.md`

**Interfaces:**

- Consumes: existing task work item, supported Linear connector, Git/PR diff, `implementation_review` contract, and `bun run governance:validate`.
- Produces: `$renivet-review <LINEAR-ID>` invocation, `REVIEW.md`, and a validated implementation-review object.

- [ ] **Step 1: Write the review skill entry point**

The skill must require this sequence:

```text
Linear retrieval -> approved contract check -> Git/PR base resolution -> progressive diff inspection
-> requirement/scenario/invariant/architecture/security/test reconciliation
-> drift classification -> REVIEW.md + YAML result -> Bun validation -> final recommendation
```

It must stop with `SPEC_CONTRACT_MISSING` when the work item is absent, invalid, or not `READY_FOR_DEV`/approved. It must not modify `src/`, execute full tests, fix code, change Linear, or merge a PR.

- [ ] **Step 2: Write reconciliation and output references**

`reconciliation.md` must define evidence-based PASS/PARTIAL/FAIL/NOT_APPLICABLE assessment for requirements, scenarios, invariants, flow/architecture, security, integrations, scope, and test expectations. It must define NO/MINOR/MATERIAL drift and Class A/B/C decision handling.

`review-output.md` must define the exact REVIEW.md headings and the stable finding record fields: `REV-<number>`, severity, category, description, evidence, impact, and recommendation.

- [ ] **Step 3: Update root and contract instructions**

Add the `$renivet-review <LINEAR-ID>` entry to `AGENTS.md` and document the normalized YAML fields, pass consistency, and `REVIEW.md` lifecycle in the work-item contract reference. Preserve the current SPEC rules unchanged.

- [ ] **Step 4: Validate skill package and formatting**

Run:

```powershell
python C:/Users/AYAN/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/renivet-review
bunx prettier --check AGENTS.md .agents/skills/renivet-review .agents/skills/renivet-spec/references/work-item-contract.md
```

Expected: skill and formatting validation pass.

- [ ] **Step 5: Commit the REVIEW skill**

```powershell
git add AGENTS.md .agents/skills/renivet-review .agents/skills/renivet-spec/references/work-item-contract.md
git commit -m "feat: add Codex REVIEW governance skill"
```

### Task 4: Preserve advisory CI behavior and report implementation evidence

**Files:**

- Modify: `.github/workflows/governance.yml` only if validator execution needs a path change; otherwise leave unchanged.
- Create: `CODEX_REVIEW_IMPLEMENTATION_REPORT.md`
- Modify: `docs/governance/codex-spec-adapter-design.md` only to add a concise SPEC -> REVIEW -> TEST lifecycle note.

**Interfaces:**

- Consumes: the existing advisory PR workflow and deterministic validator.
- Produces: a report that separates executed checks from the blocked real-pilot requirement.

- [ ] **Step 1: Verify CI needs no semantic expansion**

Confirm the existing workflow still calls `bun test scripts/governance/validate-work-item.test.ts` and validates changed work-item YAML through the updated validator. Do not add AI review logic, PR comments, labels, or branch-protection changes.

- [ ] **Step 2: Write the implementation report**

Document: repository/Codex/Linear mechanisms; REVIEW invocation; created/modified files; normalized contract; deterministic vs AI boundary; Git/PR behavior; validation commands/results; pilot status; limitations; human configuration; and next step. Mark a missing qualifying real pilot as `BLOCKED`, not passed.

- [ ] **Step 3: Run final verification**

Run:

```powershell
bun install --frozen-lockfile --lockfile-only
bun test
bun run governance:validate -- scripts/governance/fixtures/valid-l2/work-item.yaml
bunx prettier --check AGENTS.md .agents/skills docs/governance scripts/governance CODEX_REVIEW_IMPLEMENTATION_REPORT.md package.json .github/workflows/governance.yml
python C:/Users/AYAN/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/renivet-review
git diff --check
```

Expected: commands exit 0. Report any environment-only Bun cache contention separately from lockfile consistency.

- [ ] **Step 4: Commit documentation/report**

```powershell
git add CODEX_REVIEW_IMPLEMENTATION_REPORT.md docs/governance .github/workflows/governance.yml
git commit -m "docs: report REVIEW governance implementation"
```

## Plan self-review

- Spec coverage: Tasks 1-2 implement the normalized YAML and deterministic enforcement; Task 3 implements the Codex skill and review output; Task 4 preserves advisory CI and reports a pilot honestly.
- Placeholder scan: no deferred implementation steps or unspecified interfaces remain.
- Type consistency: Task 1 exports the constants Task 2 imports; Task 2 produces the fields Task 3 writes; Task 4 validates the same CLI contract.
