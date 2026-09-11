# Feasibility Assessment — P01

## Overall verdict: HIGH feasibility, GO

Every one of the nine active backlog issues (excluding deferred REN-167) is a deterministic engineering fix against code this pass read and understood in full. None requires new infrastructure, new third-party contracts, or new skills beyond standard TypeScript/SQL work already demonstrated elsewhere in this codebase (e.g. the SE-F002 fix, `product-ordering.ts`, is a template for exactly this kind of small, well-tested, isolated change).

## AI/ML feasibility: not applicable to new work

**No new AI/ML work is needed or proposed.** The external ML/search microservice already exists, is already integrated, and already handles the one genuinely "AI" task in this Epic (semantic ranking). Every issue here either hardens the *client side* of that integration (timeouts, config, parallelization) or fixes *deterministic* code around it (intent classification, dead code, caching, logging). Renivet does not need a data scientist, an ML pipeline, or a model-training budget to complete this Epic. This conclusion is CONFIRMED by reading every file in this Epic's scope — none contains a model, a training loop, or an evaluation harness; they contain HTTP clients and SQL query builders.

The one item that *would* require ML-adjacent thinking if pursued — REN-167's typo-tolerant fallback — is explicitly deferred and gated on data that doesn't exist yet. Even then, `pg_trgm` (the proposed mechanism) is a deterministic Postgres extension, not a model.

## MCP feasibility: not applicable

No Model Context Protocol integration is relevant to search hardening — this Epic touches an existing HTTP client and SQL queries, not agent tooling or LLM-facing interfaces. Not forcing a section here beyond this note, per the task brief.

## Per-issue feasibility

| Issue | Feasibility | Rationale |
|---|---|---|
| REN-146 | HIGH | Add a timeout param to existing `axios`/`fetch` calls; replace a string literal. No design risk. |
| REN-148 | HIGH (for the staged scope only) | A confirm/schedule step, not a build. Full migration would be MEDIUM-LOW and is explicitly out of scope. |
| REN-149 | HIGH | One `onSuccess` branch change; contract (`redirectUrl`) already exists and is already typed. |
| REN-151 | HIGH | `Promise.all` around two already-independent async calls; each already has its own error handling. |
| REN-154 | MEDIUM | Requires a design decision on where result-count gets logged (see `06-data/DATA_REQUIREMENTS.md`) — not hard, but not zero-decision either. |
| REN-155 | MEDIUM | Requires deciding whether to move the media-validity check into SQL or re-run `count()` post-filter — a real design choice, see `05-algorithms/TARGET_ALGORITHM.md`. |
| REN-156 | HIGH | Delete an unreferenced file; verify via build + grep that nothing breaks. |
| REN-158 | HIGH | Conditional branch already has all the state (`ragProductIds.length`) it needs. |
| REN-159 | MEDIUM | Requires picking a cache key scheme and TTL, and deciding invalidation strategy (see `10-roadmap/V1.md`) — new but small surface area, reuses existing Redis client pattern. |

## Blockers

None identified that would prevent starting any of the HIGH-feasibility items immediately. MEDIUM items each have one open design decision, listed above and centralized in `99-final/OPEN_DECISIONS.md`.
