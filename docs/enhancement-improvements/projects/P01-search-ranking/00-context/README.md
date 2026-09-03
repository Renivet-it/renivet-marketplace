# P01 — Search & Ranking Intelligence

Project-definition package for **EPIC-P01-001** in Renivet's Enhancement & Improvements program.

## What this Epic is

Renivet's catalog search is a hybrid system: a customer types a query, the app calls an **external, third-party Python ML/search microservice** (semantic/RAG retrieval, embeddings, recommendations) over plain HTTP, and falls back to a **deterministic Postgres `ILIKE` text match** when the external call fails or returns nothing. This Epic is entirely about **hardening and correcting that existing pipeline** — timeouts, parallelization, dead-code removal, caching, one reconnect of an already-computed value — not about building new ranking intelligence, training a model, or replacing the external dependency.

## What this Epic is not

- Not a new AI/ML build. Renivet does not own, train, or host the ranking model — see `07-feasibility/FEASIBILITY_ASSESSMENT.md`.
- Not a search-index migration. `pgvector` exists in the schema (CONFIRMED, see `00-context/CURRENT_STATE.md`) but a full migration off the external index is explicitly out of scope (REN-148 is a staged first step only).
- Not a redesign. No target architecture document existed before this pass, and none is being proposed — see `04-architecture/SYSTEM_ARCHITECTURE.md` for why "current" and "target" architecture are nearly identical here.

## How to read this package

Every material claim in every document is tagged:
- **CONFIRMED** — verified by reading the actual source in `renivet-marketplace/src` during this pass.
- **INFERRED** — reasoned from adjacent evidence, not directly observed.
- **UNKNOWN** — not determinable from source or available documents.
- **DECISION REQUIRED** — needs a human owner to decide before work proceeds.

Start with `00-context/CURRENT_STATE.md` (what the code does today) and `99-final/SRS.md` (the capstone, standalone-readable summary). Everything else supports those two.

## Source of truth for evidence

This package treats the portfolio-governance pass's summary (relayed in this project's brief) as a starting hypothesis, not ground truth — every claim in it was re-verified against `renivet-marketplace/src` in this pass, and corrections are called out explicitly in `01-research/RESEARCH_SUMMARY.md` where the code told a more precise story than the summary. Cross-referenced portfolio documents: `../../02-epics/EPIC_MAP.md`, `../../DEPENDENCY_GRAPH.md`, `../../AUDIT_TO_BACKLOG_TRACEABILITY.md`.
