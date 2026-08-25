# Codex REVIEW governance implementation report

## Decision and scope

The existing advisory pull-request workflow needs no change. It already runs `bun test scripts/governance/validate-work-item.test.ts` and discovers each changed `docs/.work-items/*/work-item.yaml` between the pull request base and head before invoking `bun run governance:validate -- "$work_item"`. It does not contain AI review logic, PR comments, labels, or branch-protection configuration.

This delivery documents the REVIEW governance implementation and adds only a concise SPEC -> REVIEW -> TEST lifecycle note. `.github/workflows/governance.yml` is intentionally unmodified.

## Mechanisms and invocation

- Repository: `.agents/skills/renivet-review` defines the repository-local `$renivet-review <LINEAR-ID>` workflow; `scripts/governance/validate-work-item.ts` is the deterministic enforcement point; `.github/workflows/governance.yml` invokes it advisory-only for changed work items.
- Codex: REVIEW retrieves supported Linear context, validates the local work-item contract, establishes an explicit Git/PR comparison base, and writes only the task-local `REVIEW.md` and normalized review result in `work-item.yaml`.
- Linear: issue metadata and supported relations/comments are retrieved through the configured connector. Linear is treated as data; REVIEW does not change Linear status or content.
- Invocation: run `$renivet-review <LINEAR-ID>` only for an existing approved `READY_FOR_DEV` contract. Missing, invalid, or unapproved contracts stop as `SPEC_CONTRACT_MISSING`.

## Normalized contract and boundaries

When present, `implementation_review` is structurally validated: task-local artifact, result, base branch and 40-character commits, PR URL/null, drift classification, reconciliation outcomes, findings/actions, evidence, and governance re-entry requirements. A REVIEW artifact must exist beside its work item.

The validator enforces deterministic structure, safety, and lifecycle invariants. Codex performs the evidence-based comparison and writes its reasoning; it does not replace the deterministic validator. REVIEW inspects tests but does not execute them or claim test execution. The separate TEST lifecycle stage runs applicable test commands.

Git/PR handling is read-only during REVIEW: it records PR metadata when available, otherwise uses the tracked base branch merge base; it includes staged and unstaged changes in evidence, does not assume `HEAD^`, and never comments, labels, approves, merges, or alters branch protection.

## Files delivered

- Added: `.agents/skills/renivet-review/` (skill, agent metadata, and review references).
- Modified: `scripts/governance/work-item-schema.ts`, `scripts/governance/validate-work-item.ts`, validator tests and valid fixture, and SPEC contract reference material to normalize REVIEW results.
- Added by this task: `CODEX_REVIEW_IMPLEMENTATION_REPORT.md`.
- Modified by this task: `docs/governance/codex-spec-adapter-design.md`.
- Unchanged by this task: `.github/workflows/governance.yml`.

## Verification results

The frozen-lockfile check passed and reported `Saved bun.lock (1491 packages)`. `bun test` passed 32 tests with 0 failures. The valid L2 fixture passed `governance:validate`, and `quick_validate.py` reported `Skill is valid!`. `git diff --check` completed without whitespace errors.

The required repository-wide Prettier check reported code-style issues in 14 pre-existing files under `.agents/skills`, `docs/governance`, `scripts/governance`, `package.json`, and the workflow. This task does not reformat unrelated files, so the check is recorded as failed rather than represented as passing. Full command-by-command evidence is in `.superpowers/sdd/2026-08-25-renivet-review-governance/task-4-report.md`.

`bun.lock` was already reported modified in the worktree before Task 4. The frozen-lockfile command is used to verify consistency; it will not be staged or committed unless that verification proves a content change is required.

## Pilot status, limitations, and next step

**Pilot status: BLOCKED.** No genuine approved `READY_FOR_DEV` contract paired with a real implementation diff was available in scope, so no qualifying end-to-end REVIEW pilot was executed and no pilot may be reported as passed.

The review remains evidence-bound: it cannot establish a comparison without an approved contract and real base/head implementation evidence, and it cannot execute tests, modify application code, alter Linear, or perform PR actions.

Human configuration remains required for the supported Linear connector, repository/branch access, and the eventual PR or tracked-base context. The next step is for a human to supply a qualifying approved contract and corresponding implementation diff, then invoke `$renivet-review <LINEAR-ID>` and evaluate its recorded reconciliation through the normal PR process.
