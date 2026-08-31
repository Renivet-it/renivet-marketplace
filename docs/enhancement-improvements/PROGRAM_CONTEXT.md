# Renivet Enhancement & Improvements — Program Context

## Purpose
Durable, concise context for the Enhancement & Improvements program. Detailed evidence lives in the audit, QC, SRS, Linear, and governance artifacts.

## Core objective
Make Renivet a reliable, measurable, secure, cost-conscious, scalable sustainable marketplace. This is not a rewrite and not an "AI everywhere" program.

## Formal Epics
- P01 — Search & Ranking
- P02 — Recommendations & Personalization
- P05 — Customer Journey & UX
- P06 — Measurement & Experimentation
- P08 — Brand Data & Commerce Integration

P03 Catalog, P04 Merchandising, and P07 standalone ML/AI remain evidence-gated; do not promote them without new evidence.

## Cross-cutting streams
Security & Compliance; Infrastructure/Staging/Reliability; Production-Safety QA; Engineering Governance; Repo/Type-Safety/Tech Debt.

## Engineering lifecycle
Research/QC → Epic/SRS → Linear → /SPEC → Development → /REVIEW → /TEST → Staging → Independent Validation → Production → Monitoring.

Linear status is not proof of production closure.

## Source-of-truth hierarchy
1. Remote Git — shipped/merged implementation truth
2. Live Linear — current tracking/ownership
3. Committed governance artifacts — requirements/decisions/evidence
4. Local/uncommitted state — active-work context only, never production proof

When sources conflict, record and resolve the conflict. Never silently choose one.

## Evidence discipline
Classify material statements as CONFIRMED, INFERRED, UNKNOWN, or DECISION REQUIRED.
Do not turn source-level evidence into runtime/business-impact claims without evidence.

## Anti-overengineering
Prefer: Reuse → Simplify → Small Build → Buy only when justified.
Do not add ML infrastructure, vector DBs, feature stores, MCP, distributed workflow frameworks, or new managed services without measured need.

## AI rules
AI assists; deterministic systems own transactional truth.
AI must not autonomously write SKU identity, inventory, price, tax, or financial/order state.
P08 V1 is deterministic-first with narrow, human-confirmed AI assistance.

## V1/V2/V3
V1 = smallest safe valuable capability.
V2/V3 remain tracked with explicit triggers.

## Operating principle
The program is now execution-oriented. Do not restart broad research unless a concrete unknown blocks a safe decision.
