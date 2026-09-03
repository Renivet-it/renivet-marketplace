# Executive Summary — P01 Search & Ranking Intelligence

## What we found

Renivet's catalog search works today via an external ML/search microservice with a Postgres text-match fallback, plus a separate, already-built rule-based system that classifies whether a search is really a brand/category lookup. Both pieces function, but this pass confirmed ten specific defects or inefficiencies — none of them requiring new AI, a new vendor, or a redesign to fix.

The single most consequential finding: **the system already knows when a search is really a brand lookup and computes exactly where to send the customer — then throws that answer away and shows a generic filtered list instead**, on every search (REN-149). This is a one-line fix with outsized discovery-experience value.

The single highest-leverage fix for reliability: **no call to the external search/ML service has a timeout** (REN-146) — a slow-but-not-down upstream can leave a search hanging with no bound today. This also benefits the Recommendations Epic (P02), which shares the same dependency.

## What we recommend

Ship all nine active backlog issues (REN-146, 148, 149, 151, 154, 155, 156, 158, 159) as a single V1 — each is small, independently safe, and none needs to wait on the others except two minor sequencing preferences noted in `10-roadmap/V1.md`. Do not build anything beyond this list: no new ranking model, no full search-index migration, no dashboards. Keep REN-167 (typo tolerance) deferred exactly as scoped, until REN-146 produces the data needed to justify it.

## What needs a human decision before/while implementing

Two small design choices (where REN-154 logs result counts; whether REN-155 fixes via SQL predicate or recompute) and one strategic question with no urgency (whether Renivet should ever own search/ranking end-to-end instead of depending on the external service) — see `99-final/OPEN_DECISIONS.md`.

## Bottom line

**GO.** This is low-risk, high-clarity hardening work on a capability that already exists and already mostly works.
