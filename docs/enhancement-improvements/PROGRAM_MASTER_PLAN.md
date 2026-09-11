# Program Master Plan — ENH

The full structure this program establishes: PROGRAM → EPICS → STORIES → ISSUES → TASKS → TEST, plus supporting Research/Audit/POC/Decision/Risk. This document is the capstone — every claim in it is sourced from another document in this set; nothing new is asserted here.

## PROGRAM

**ENH — Renivet Enhancement & Improvements.** Not a Linear object (`LINEAR_AGILE_MODEL.md`) — a documentation-layer program reconciling existing audits, research, QA, and backlog.

## EPICS

5 formalized, 3 explicitly not (evidence-based, not arbitrary) — full detail in `02-epics/EPIC_MAP.md`:

- **EPIC-P01-001** Search & Ranking Intelligence
- **EPIC-P02-001** Recommendations & Personalization
- **EPIC-P05-001** Customer Journey & UX
- **EPIC-P06-001** Measurement & Experimentation
- **EPIC-P08-001** Brand Data & Commerce Integration Platform
- P03/P04/P07 — NOT YET FORMALIZED, reasons and revisit conditions named in `02-epics/EPIC_MAP.md`

Plus 5 cross-cutting streams outside the P01–P08 numbering (`XC-INFRA-001`, `XC-SEC-001`, `XC-QA-001`, `XC-GOV-001`, `XC-DEBT-001`) — real, substantial, deliberately not force-fit into a product Epic (§15).

## STORIES

Mostly absent by design. Renivet's real backlog is overwhelmingly finding-driven (audit → engineering issue), not capability-driven (persona → story → issue) — per `LINEAR_AGILE_MODEL.md`'s mapping, retrofitting synthetic stories onto audit findings would violate the program's own "do not force fake hierarchy" rule (§5, §9). Where a real story exists, it's noted inline in `02-epics/EPIC_MAP.md`; none were found substantial enough to warrant a dedicated STORY-PXX-### catalog in this pass.

## ISSUES

~170 real Linear issues, of which this program traced ~60 meaningful audit-derived findings to their disposition in `AUDIT_TO_BACKLOG_TRACEABILITY.md`. 4 real, severe findings (`DEF-009/010/003/002`) have **no** issue yet — the single most important gap this program found (`08-risks/PORTFOLIO_RISK_REGISTER.md`).

## TASKS

Linear's native sub-issue mechanism (`parentId`), used sparingly today. No dedicated task catalog needed — see `LINEAR_AGILE_MODEL.md`.

## TEST

Governed by the existing SPEC→REVIEW→TEST system (`09-governance/`), not duplicated here. Real gap found: the TEST stage isn't yet proven end-to-end on a real (non-fixture) issue.

## RESEARCH

One program, complete, unimplemented, untracked in Linear: P08 (`03-research/README.md`).

## AUDIT

Four audit programs plus one self-frozen QA engagement (`04-audits/README.md`), fully traced (`AUDIT_TO_BACKLOG_TRACEABILITY.md`).

## POC

One proposed, not built, not authorized to build by its own research program (`06-poc/README.md`).

## DECISION

6 decision clusters this pass found blocking or unresolved, staged for a human owner (`07-decisions/DECISION_QUEUE.md`) — not decided by this program.

## RISK

Full register, P0-first, with the untracked-defect flag at the top (`08-risks/PORTFOLIO_RISK_REGISTER.md`).

## Supporting standards and lifecycles

`LINEAR_AGILE_MODEL.md`, `NOMENCLATURE_STANDARD.md`, `AGILE_PROJECT_LIFECYCLE.md`, `ML_AI_LIFECYCLE.md`, `AI_GOVERNANCE.md`, `MCP_GOVERNANCE.md`, `PORTFOLIO_ANTI_OVERENGINEERING.md`, `DEPENDENCY_GRAPH.md`, `10-roadmap/EXECUTION_SEQUENCE.md`.

## Final quality gate (self-check against §33)

- [x] Actual Linear hierarchy inspected — `LINEAR_AGILE_MODEL.md`
- [x] Agile concepts mapped to real Linear capabilities — same
- [x] Portfolio reconciled — `01-portfolio/MASTER_REGISTER.md`
- [x] Projects classified — `02-epics/EPIC_MAP.md` (formalized vs. not)
- [x] Stories defined where appropriate — deliberately mostly absent, reasoned in this document
- [x] Engineering issues traced — `AUDIT_TO_BACKLOG_TRACEABILITY.md`
- [x] Tasks defined conceptually — `LINEAR_AGILE_MODEL.md`
- [x] Audit-to-backlog traceability created — `AUDIT_TO_BACKLOG_TRACEABILITY.md`
- [x] Cross-project dependencies mapped — `DEPENDENCY_GRAPH.md`
- [x] Shared foundations identified — external ML/search microservice (P01/P02), staging (all), governance tooling (all)
- [x] Common lifecycle defined — `AGILE_PROJECT_LIFECYCLE.md`
- [x] ML lifecycle defined — `ML_AI_LIFECYCLE.md` (honestly mostly N/A today)
- [x] Experimentation standard — not separately documented; no Epic in this portfolio runs a live experiment/A-B test today (verified absent, not assumed — no experimentation framework found anywhere in the repo, audits, or research). Revisit if one is proposed.
- [x] AI governance defined — `AI_GOVERNANCE.md`
- [x] MCP governance defined — `MCP_GOVERNANCE.md`
- [x] Naming standard defined — `NOMENCLATURE_STANDARD.md`
- [x] Folder structure defined — this tree
- [x] V1/V2/V3 defined — per-Epic in `02-epics/EPIC_MAP.md`, most explicit for P08
- [x] Execution sequence defined — `10-roadmap/EXECUTION_SEQUENCE.md`
- [x] Urgent parallel streams preserved — NOW section of execution sequence explicitly independent of portfolio sequencing
- [x] No forgotten major work identified — DEF-009/010/003/002 surfaced, not left buried
- [x] No duplicate architecture detected — `PORTFOLIO_ANTI_OVERENGINEERING.md` (one real duplication found: checkout implementations, REN-152, already tracked)
- [x] No Linear mutations — read-only queries only, this session
- [x] No application changes — documentation only, this session

## Deferred honestly, not silently

The DEF-011 through DEF-036 tail (`qa/FINDINGS/DEFECT_RECORDS.md`) was not individually reconciled against Linear in this pass — named as a real gap in `AUDIT_TO_BACKLOG_TRACEABILITY.md`, not claimed complete.
