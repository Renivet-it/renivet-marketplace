# Governance — Index

This program does not duplicate Renivet's existing governance systems. It references them.

| System | Canonical location | What it governs |
|---|---|---|
| Per-issue SPEC → REVIEW → TEST lifecycle | `docs/governance/codex-spec-adapter-design.md`, `.agents/skills/renivet-spec/`, `.agents/skills/renivet-review/`, `scripts/governance/` | Every individual engineering issue's contract, implementation-review, and test evidence. See `../AGILE_PROJECT_LIFECYCLE.md` for how this program's Epics/issues flow through it. |
| Full governance state machine (superset) | `docs/ENGINEERING_GOVERNANCE_PHASE1_PROPOSAL.md` | The complete `INTAKE → ... → MERGED` state machine and risk model (L0–L3) the shipped SPEC/REVIEW tooling implements a compressed version of. |
| Real work-item examples | `docs/.work-items/README.md`, and `REN-108`, `REN-115`, `REN-143`, `REN-TEST` (fixture) subfolders | Branch-local, temporary by design — deleted before merge. REN-115 is the most complete genuine specimen (SPEC → Critic → REVIEW, real commits). |
| ADR promotion target | `docs/decisions/README.md` | Currently empty by design — nothing promoted yet. This program's `../07-decisions/` is a staging area for decisions this reconciliation surfaced as needing an owner, not a replacement for this folder. |
| Production-safety audit engagement | `qa/MASTER_PLAN.md`, `qa/SCOPE.md`, `qa/RELEASE_GATE.md` | A one-time, evidence-integrity-strict audit (not an ongoing framework), currently self-frozen pending 5 gate items — see `../08-risks/PORTFOLIO_RISK_REGISTER.md`. Does not cross-reference the SPEC/REVIEW/TEST system above; both are real, neither should be merged into the other without a deliberate decision to do so. |
| CI enforcement | `.github/workflows/governance.yml` | Validates every changed `docs/.work-items/*/work-item.yaml` on PRs — advisory-only today, not a required status check. |

## What this program adds

Only `../AGILE_PROJECT_LIFECYCLE.md` (the canonical-stage-to-real-mechanism mapping) and `../AI_GOVERNANCE.md`/`../MCP_GOVERNANCE.md` (net-new principles, since no equivalent existed before this pass). Everything else in this folder is a pointer, not a parallel system.

## One real gap this pass found

The `renivet-test` stage (converting REVIEW findings into executed tests) is not yet proven end-to-end on a real, non-fixture Linear issue — REN-115 is the furthest any real issue has gotten (SPEC → REVIEW complete; no TEST-PLAN/TEST-REPORT exists for it). Worth closing before this program relies on TEST as a reliable gate for the NOW/NEXT items in `../10-roadmap/EXECUTION_SEQUENCE.md`.
