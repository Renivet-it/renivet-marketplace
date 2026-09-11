# Renivet Enhancement & Improvements — Program Documentation

Agile portfolio governance and reconciliation for Renivet's ongoing enhancement/improvement work. Read-only research and reconciliation only — no application code, Linear issues, or infrastructure were changed to produce this documentation (2026-08-29).

## Start here

1. **`08-risks/PORTFOLIO_RISK_REGISTER.md`** — 4 P0-severity findings from `qa/RELEASE_GATE.md` (unauthenticated PII-leaking endpoint, cross-tenant privilege escalation, inventory double-decrement, a stuck live shipment) have **no Linear issue**. Read this first.
2. **`PROGRAM_MASTER_PLAN.md`** — the full PROGRAM → EPICS → STORIES → ISSUES → TASKS → TEST structure, capstone document.
3. **`02-epics/EPIC_MAP.md`** — which of the hypothesized P01–P08 projects are real (evidenced) vs. not yet formalized.
4. **`01-portfolio/MASTER_REGISTER.md`** — every workstream in one table.
5. **`10-roadmap/EXECUTION_SEQUENCE.md`** — NOW/NEXT/LATER/TRIGGERED/DEFERRED.

## Folder structure

```
00-program/       — program overview
01-portfolio/      — MASTER_REGISTER.md
02-epics/          — EPIC_MAP.md
03-research/       — index into docs/research/ (not moved)
04-audits/         — index into docs/audits/, docs/infrastructure-audits/, docs/growth-audits/, qa/ (not moved)
05-architecture/   — index of target-architecture docs (not moved)
06-poc/            — index of proposed POCs (not moved)
07-decisions/      — DECISION_QUEUE.md
08-risks/          — PORTFOLIO_RISK_REGISTER.md
09-governance/     — index into docs/.work-items/, docs/governance/, qa/ (not moved)
10-roadmap/        — EXECUTION_SEQUENCE.md
11-traceability/   — pointer to AUDIT_TO_BACKLOG_TRACEABILITY.md (top level, per spec)
```

Top-level standards documents (per program spec, kept at this level rather than nested):

- `LINEAR_AGILE_MODEL.md` — what Linear actually supports here, and the mapping used
- `NOMENCLATURE_STANDARD.md` — ID scheme for this documentation layer
- `AUDIT_TO_BACKLOG_TRACEABILITY.md` — every meaningful finding, traced
- `DEPENDENCY_GRAPH.md` — validated (not assumed) cross-project dependencies
- `AGILE_PROJECT_LIFECYCLE.md` — canonical lifecycle mapped to Renivet's real SPEC→REVIEW→TEST tooling
- `ML_AI_LIFECYCLE.md` — honest assessment: mostly N/A today, no owned model exists
- `AI_GOVERNANCE.md` — principles, generalized from P08's guardrail design
- `MCP_GOVERNANCE.md` — MCP is dev/governance tooling today, not product architecture
- `PORTFOLIO_ANTI_OVERENGINEERING.md` — checked against real findings, not a generic checklist
- `PROGRAM_MASTER_PLAN.md` — the capstone

## What this program did not do

Preserve existing historical artifact locations — nothing under `docs/audits/`, `docs/research/`, `docs/infrastructure-audits/`, `docs/growth-audits/`, `qa/`, or `docs/.work-items/` was moved. This folder links to them; it does not replace them. No Linear issues, projects, or labels were created or modified. No application code, tests, package/lock files, CI/CD, Vercel, database, Redis, or environment configuration was changed.
