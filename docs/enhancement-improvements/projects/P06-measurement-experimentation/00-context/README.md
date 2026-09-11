# P06 — Measurement & Experimentation

Project-definition package for Epic **EPIC-P06-001 (Measurement & Experimentation)** in Renivet's Enhancement & Improvements program.

## Scope

Make Renivet's analytics (PostHog, Meta CAPI/Pixel, GA4) accurately capture what customers actually do, so downstream ad spend and product decisions aren't built on corrupted data. This is an instrumentation-correctness Epic, not a new-capability Epic: nearly every item is "make an existing signal trustworthy," not "build a new measurement surface."

## Source documents (read, not re-derived)

- `docs/enhancement-improvements/02-epics/EPIC_MAP.md` — EPIC-P06-001 entry (line ~43)
- `docs/enhancement-improvements/DEPENDENCY_GRAPH.md` — the real P05 → P06 edge (checkout/payment events feed measurement)
- `docs/enhancement-improvements/01-portfolio/MASTER_REGISTER.md` — EPIC-P06-001 row
- `docs/enhancement-improvements/AUDIT_TO_BACKLOG_TRACEABILITY.md`
- `docs/enhancement-improvements/07-decisions/DECISION_QUEUE.md` — DECISION-P06-001 (GA4 need)
- `docs/growth-audits/2026-08-23/README.md` and its CSVs — independent 5-month marketing/analytics data pull

## Linear project

"Customer Tracking & Analytics Instrumentation" — REN-128 through REN-134, plus cross-cutting `qa-finding` issues REN-145, REN-154, REN-162, REN-164, REN-166.

## How to read this package

Start with `99-final/EXECUTIVE_SUMMARY.md` and `99-final/GO_NO_GO.md` for the verdict. `01-research/` holds the source-code verification performed for this pass (all claims below were re-checked against the live `src/` tree, not just restated from the prior audit). `05-algorithms/` is the most load-bearing technical section for this Epic — "algorithm" here means event definitions, identity resolution, and attribution/reconciliation logic, not ML.

## What this package is not

Not a fix implementation, not a Linear issue creator, not a POC, not a deploy. Documentation only, per the governing task.
