# REN-158 Independent Critique

## Review basis

Fresh-context, read-only review of the REN-158 contract against the Linear issue, the active `getProducts()` query path, the P01 search-ranking documentation, and the existing test inventory. No application source or test file was modified during review.

## Category review

- Requirements and scenarios: PASS after clarifying the meaning of result-content regression.
- Failure and recovery: PASS. Empty, unusable, non-OK, and thrown RAG outcomes retain local fallback.
- Security and privacy: PASS with a boundary constraint. The task must use parameterized ID membership and add no raw interpolation.
- State and data consistency: PASS. One selected predicate is shared by data and count queries.
- Integrations and idempotency: PASS. The external API contract, cache/revalidation behavior, retries, and idempotency are unchanged.
- Compatibility and migration: PASS. No schema, index, API, or persisted-data migration is required.
- Observability and testability: PASS after making branch-level automated coverage and staging query-plan evidence explicit.
- Assumptions and dependencies: PASS. Staging access and controllable RAG-hit/fallback cases remain execution prerequisites, not design blockers.

## Findings

### CRIT-158-001

- Severity: MAJOR
- Category: requirements and scenarios
- Evidence: Linear simultaneously prescribes RAG-only candidate membership and says result content is unchanged.
- Finding: Those statements cannot both mean identical result membership; the current `OR` can include lexical-only rows outside the returned RAG IDs.
- Disposition: Resolved in `REQ-158-006` and `DEC-158-001`. RAG candidates/order and fallback behavior are preserved, while lexical-only additions on RAG success are intentionally removed.

### CRIT-158-002

- Severity: MINOR
- Category: failure and recovery
- Evidence: The current integration leaves `ragProductIds` empty for non-array payloads, non-OK responses, and thrown fetch/JSON processing.
- Finding: Testing only an empty successful array would miss other paths that must retain fallback.
- Disposition: Added `SCN-158-003`, `SCN-158-004`, and `TEXP-158-002`.

### CRIT-158-003

- Severity: MINOR
- Category: observability and testability
- Evidence: Linear reports strong structural evidence but no measured query cost.
- Finding: Code-level assertions alone cannot prove planner behavior or performance impact.
- Disposition: `TEXP-158-004` requires staging `EXPLAIN (ANALYZE, BUFFERS)` for both branches and avoids production execution.

### CRIT-158-004

- Severity: MINOR
- Category: security and privacy
- Evidence: RAG IDs originate outside the application and enter database query construction.
- Finding: The focused change must not extend pre-existing raw SQL interpolation patterns.
- Disposition: Added `SEC-158-001`, `INV-158-005`, and the scope constraint in `REQ-158-007`.

## Conclusion

The revised design has no unresolved blocker or Class C decision. It is ready for owner approval after deterministic governance validation.
