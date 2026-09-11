# Agile Project Lifecycle

The canonical lifecycle (§17), mapped onto what Renivet **actually has running today** — not a new process invented by this program. Two real systems already implement most of this: `ENGINEERING_GOVERNANCE_PHASE1_PROPOSAL.md`'s full state machine, compressed into the shipped `.agents/skills/renivet-spec` / `renivet-review` tooling (`docs/governance/codex-spec-adapter-design.md`), and the `qa/` production-safety program for independent validation. This document reconciles them against the canonical stage list and states plainly, per program rule, why a stage is skipped for a given kind of work.

## Canonical stages, mapped to real Renivet mechanisms

| Canonical stage | Real Renivet equivalent | Notes |
|---|---|---|
| PROBLEM | An audit finding, QA finding, or a stated business need | Source is always named — see `AUDIT_TO_BACKLOG_TRACEABILITY.md`. |
| DISCOVERY | Repository/architecture reconnaissance (`repository_investigation` block in `work-item.yaml`) | Mandatory for L1+; skipped only for L0 (trivial, no work item created at all). |
| RESEARCH | A dedicated research program, where one exists (e.g. `docs/research/brand-commerce-integration/`) | **Skipped by default** — only Epic-scale, architecturally uncertain work (P08-style) warrants a full research program. Most engineering issues go straight from DISCOVERY to SPECIFICATION. |
| CUSTOMER/BUSINESS VALIDATION | `decisions[DEC-*]` with class `HUMAN_CONFIRMATION` in `work-item.yaml` | Only triggered where a decision has high consequence regardless of AI confidence — not a universal gate. |
| FEASIBILITY | Folded into SPECIFICATION for L1/L2; a dedicated step only for research-scale work | See P08's "anti-overengineering gate" (`docs/research/brand-commerce-integration/14-critic/ANTI_OVERENGINEERING.md`) as the model for how feasibility should be argued when it does happen. |
| ARCHITECTURE | `flow_design` block in `work-item.yaml`, or a dedicated architecture doc for Epic-scale work | Skipped for L0/L1 (too small to need one). |
| CRITIC | **Mandatory for L2/L3** — a fresh, isolated, independent Codex/Claude critic subagent, deliberately not given the Architect's reasoning chain, producing `CRITIQUE.md` with `CRIT-*` findings (severities DESIGN_BLOCKER/MAJOR/MINOR) | A DESIGN_BLOCKER finding blocks `APPROVED` status until resolved in the contract. This is the same adversarial-independence pattern used in `docs/research/brand-commerce-integration/14-critic/` and in this program's own inventory-agent dispatch. |
| EPIC → USER STORIES → ENGINEERING ISSUES | Linear Project/Issue, per `LINEAR_AGILE_MODEL.md`'s actual mapping | Most Renivet work skips the STORY layer entirely — findings go directly to engineering-issue-shaped Linear issues. This is appropriate for audit-derived remediation work and should not be retrofitted. |
| SPEC | `$renivet-spec <LINEAR-ID>` — writes `work-item.yaml` + `SPEC.md` to `docs/.work-items/<ID>/`, defining `requirements[REQ-*]` → `scenarios[SCN-*]` → `invariants[INV-*]` → `test_expectations[TEXP-*]` | The authoritative machine-checkable contract; validated by `scripts/governance/validate-work-item.ts`, enforced (advisory-only today) in `.github/workflows/governance.yml`. |
| DEVELOPMENT | Real implementation against the approved contract | Out of this program's scope to describe further — it's ordinary engineering work once `READY_FOR_DEV` is reached. |
| REVIEW | `$renivet-review <LINEAR-ID>` — reconciles the implementation diff against the approved contract, records `material_drift: NO_DRIFT/MINOR_DRIFT/MATERIAL_DRIFT` and per-requirement/scenario/invariant/security/test-coverage reconciliation, writes `REV-*` findings to `REVIEW.md` | `MATERIAL_DRIFT` on a `READY` item forces re-entry into governance — the contract isn't allowed to silently drift from what shipped. |
| TEST | A separate `renivet-test` stage converts REVIEW findings into **executed** tests, writes `TEST-PLAN.md`/`TEST-REPORT.md` | Hard rule: never fabricates evidence — refuses to mark unexecuted tests PASS/FAIL and returns `DECISION_REQUIRED` instead when no real diff exists to test against. Not yet proven end-to-end on a real (non-fixture) issue as of this pass — see `09-governance/`. |
| STAGING | Deploy to the now-hardened staging environment (`XC-INFRA-001`, REN-143) | Staging isolation/safety is a real, evidenced precondition for trustworthy STAGING-stage testing — see `DEPENDENCY_GRAPH.md`'s cross-cutting constraints. |
| INDEPENDENT VALIDATION | The `qa/` production-safety program, where its scope overlaps | `qa/` is a separate, one-time audit engagement (not a per-issue gate) — it validates broad surfaces (checkout, security, marketplace-ops), not every individual engineering issue. Level 1 (read-only)/Level 2 (synthetic account)/Level 3 (real, capped COD order) production-testing tiers apply here specifically, not to every STAGING deploy. |
| RELEASE | Merge to `master`, per the repo's normal branch protection | `docs/.work-items/<ID>/` is deleted as the PR's final commit before merge — it's branch-local and temporary by design, recoverable via `git log --follow` or the merged PR, not meant to accumulate. |
| MONITORING | Not yet a formal stage anywhere in the evidence gathered | Real gap — see `PORTFOLIO_ANTI_OVERENGINEERING.md` for why this program does not invent a monitoring framework to fill it, and `08-risks/` for why it matters most for the untracked P0 items. |
| LEARN / ITERATE | Not a formal stage — the ecommerce-intelligence audit's own QC pass (re-verifying prior findings, discovering broader scope on CJ-F004/AN-F001) is the closest real precedent | Worth naming as a pattern worth repeating (a periodic QC re-pass on shipped fixes), not worth inventing new tooling for. |

## Risk-gated shortcuts (from `ENGINEERING_GOVERNANCE_PHASE1_PROPOSAL.md`)

`final_risk = MAX(initial_risk, path_rule_risk, semantic_risk)`, four levels:

- **L0** — trivial; skips straight to `READY_FOR_DEV`, no work item created at all.
- **L1** — targeted/lightweight; `INTAKE → CLASSIFIED → SPECIFICATION(Requirements only) → READY_FOR_DEV`, no Critic required. Example: REN-108 (guest wishlist header/footer).
- **L2/L3** — full chain including mandatory independent Critic. L3 triggers (auth, payments, orders, PII, shipping, DB migrations, `fb-capi.ts`, unicommerce) are mapped to concrete repo paths and **mechanically enforced** via `git diff` against that path list — an L1-declared PR touching an L3 path gets auto-escalated. Example: REN-115 (full cycle, real Critic pass with a `BLOCKED_PENDING_REVISION` first round).

**Why this matters for the Enhancement & Improvements program specifically:** every engineering issue named in `AUDIT_TO_BACKLOG_TRACEABILITY.md` should be risk-classified through this existing mechanism before implementation starts, not through a new classification this program invents. REN-93/94/95 (unauthenticated endpoints) and REN-144/145 (P0 payment/analytics) are unambiguously L3 by the path-rule list above.

## What this program does NOT do

Duplicate the SPEC→REVIEW→TEST system's detail, invent a competing state machine, or require every audit finding to go through every stage — L0/L1 shortcuts exist precisely so trivial fixes don't carry Epic-scale process weight. Reference `docs/governance/codex-spec-adapter-design.md` and `ENGINEERING_GOVERNANCE_PHASE1_PROPOSAL.md` directly for implementation detail; this document is the reconciliation layer, not a replacement.
