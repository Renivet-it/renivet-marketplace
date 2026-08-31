# Software Requirements Specification — P01: Search & Ranking Intelligence

Standalone-readable capstone for EPIC-P01-001. All claims are CONFIRMED via source read of `renivet-marketplace/src` during this pass unless marked INFERRED/UNKNOWN/DECISION REQUIRED.

## WHY

Renivet's catalog search combines an external, third-party ML/search microservice (semantic/RAG retrieval) with a deterministic Postgres `ILIKE` fallback and a separate rule-based intent classifier (brand/category/subcategory/product-type detection). This pipeline works today but has ten confirmed defects/inefficiencies: unbounded external-call latency, a discarded intent-classification result, avoidable sequential external calls, a no-op click-logging stub, a result-count/data mismatch, dead duplicate code, a redundant query predicate, no listing cache, no index-drift visibility, and (deferred) no typo tolerance. None of these is a missing feature — all are correctness, reliability, or efficiency gaps in a capability that already ships. See `00-context/BUSINESS_CONTEXT.md`.

## WHAT

Nine active fixes (REN-146, 148, 149, 151, 154, 155, 156, 158, 159) plus one explicitly deferred item (REN-167) and one already-resolved item requiring only a regression test (SE-F002). Full functional scope in `03-requirements/FUNCTIONAL_REQUIREMENTS.md`; business framing in `02-business-customer/BUSINESS_REQUIREMENTS.md`. Three real user stories exist (`02-business-customer/USER_STORIES.md`); the remainder are engineering-only fixes correctly not framed as stories.

## HOW

Each fix operates on already-understood code:
- **Timeouts** (REN-146): add `timeout`/`AbortSignal.timeout()` to 4 live external-call sites; fix hardcoded-IP/dead-env-override configuration.
- **Redirect reconnect** (REN-149): use the already-computed `redirectUrl` in the search bar's `onSuccess` handler instead of discarding it.
- **Parallelization** (REN-151): `Promise.all` the independent brand-embedding-match and RAG-fetch branches in `getProducts()`.
- **Click/result logging** (REN-154): implement the `logSearchClick` stub; persist result counts.
- **Count consistency** (REN-155): align the SQL `count()` with the application-level media-validity filter.
- **Dead code removal** (REN-156): delete the unused `ai-suggestion.ts` client.
- **Redundant predicate removal** (REN-158): only build the ILIKE fallback predicate when RAG returns zero candidates.
- **Listing cache** (REN-159): Redis-cache category-only/category+sort listing responses, reusing the existing `mediaCache` pattern.
- **Staged drift step** (REN-148): a confirmation/scheduling step only, not a reconciliation pipeline.

Full architecture (current and target, nearly identical by design) in `04-architecture/SYSTEM_ARCHITECTURE.md`; algorithm detail in `05-algorithms/`.

## WITH WHAT

No new technology. Reuses existing `axios`/`fetch`, existing Redis client pattern, existing Postgres/Drizzle/pgvector, existing tRPC/React Query wiring. No new AI/ML model, no new vendor, no MCP integration — see `07-feasibility/FEASIBILITY_ASSESSMENT.md`.

## HOW MUCH

No cost model or numeric latency/conversion target exists (UNKNOWN, see `08-reliability/PERFORMANCE.md` and `02-business-customer/BUSINESS_CONTEXT.md`). Engineering effort is estimated qualitatively as HIGH feasibility / small-to-medium effort per issue in `07-feasibility/FEASIBILITY_ASSESSMENT.md`; no story-point or hour estimate is asserted.

## HOW DO WE KNOW IT WORKS

Per-issue acceptance criteria in `03-requirements/ACCEPTANCE_CRITERIA.md`; test strategy (unit/integration/E2E/negative/failure/regression) in `09-validation/TEST_STRATEGY.md`, routed through the existing SPEC→REVIEW→TEST governance and `renivet-test` skill. The existing `product-ordering.test.ts` regression test must keep passing through every change that touches `getProducts()`'s ordering logic. No A/B experimentation is proposed (`09-validation/EXPERIMENT_STRATEGY.md`) — these are deterministic correctness fixes, not hypotheses.

## WHAT IS NOT INCLUDED

- Any new ranking algorithm or ML model (external microservice is reused, not replaced or retrained).
- Full migration off the external search index (REN-148 is staged/cheap-step-only).
- Typo-tolerant fallback (REN-167) — explicitly deferred, gated on REN-146's future data.
- Any refactor of `getProducts()`'s overall structure beyond the specific fixes listed (see `11-critique/ARCHITECTURE_CRITIQUE.md`).
- Dashboards, alerting, or A/B infrastructure (no baseline metrics exist yet to justify them).
- SE-F008 (unused `getSuggestions` generator) — tracked under REN-107/XC-DEBT-001, not this Epic.

## Verdict

See `99-final/GO_NO_GO.md`. Overall: **GO** for the nine active V1 issues; **DEFER** for REN-167 as already scoped by the portfolio.
