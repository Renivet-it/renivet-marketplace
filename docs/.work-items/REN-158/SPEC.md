# REN-158 Engineering Specification

## Title

Skip the unindexed ILIKE fallback predicate when external RAG search returns candidates

## Status

READY_FOR_DEV — explicitly approved by Ayan Ganguly on 2026-09-09.

## Scope and outcome

`getProducts()` currently combines successful external RAG candidate IDs with the local leading-wildcard search predicate by using `OR`. That makes both the paginated product query and its count query carry four `ILIKE` checks and four correlated `EXISTS` checks even when RAG has already supplied candidates.

The implementation will select exactly one search-candidate predicate in the non-exact-brand path:

- one or more RAG IDs: `inArray(products.id, ragProductIds)` only;
- no usable RAG IDs, including external failure: the existing local fallback predicate only.

In scope:

- The search-predicate selection in `src/lib/db/queries/product.ts`.
- A small testable predicate-selection boundary if needed for focused automated coverage.
- Automated regression coverage for RAG-hit and fallback branches.
- Staging query-plan verification with representative RAG-hit and fallback searches.

Out of scope:

- Replacing local fallback with full-text search or `pg_trgm` (REN-167).
- External-service timeout/configuration work (REN-146), concurrent external calls (REN-151), ranking changes, classifier changes, caching, or new observability.
- Remediating pre-existing construction of the RAG relevance-order `CASE` expression; no new raw-SQL interpolation may be introduced.
- Database schema or index changes.

## Repository evidence

- `src/lib/db/queries/product.ts:1243-1273` constructs the local fallback from four leading-wildcard `ILIKE` predicates and four correlated `EXISTS` predicates.
- `src/lib/db/queries/product.ts:1275-1284` currently combines RAG IDs and the local fallback with `or(...)` when RAG returns IDs.
- `src/lib/db/queries/product.ts:1593-1621` reuses one `whereClause` for both product retrieval and total count, so the redundant branch affects both database statements.
- `src/lib/db/queries/product.ts:1511-1527` independently applies RAG relevance ordering; predicate selection must not change that ordering rule.
- The P01 search-ranking acceptance criteria define RAG-hit as RAG-only and RAG miss/failure as local fallback.
- Linear records query-shape confidence as strong but actual performance cost as unmeasured pending `EXPLAIN ANALYZE`.

## Risk assessment

Final risk: L2.

The patch is localized and reversible, but it changes candidate-membership semantics on a customer-facing search path and crosses an external-service/database boundary. A mistake could return no results after an external failure, retain the expensive predicate, or change exact-brand/search sorting behavior. It does not change authentication, payment, order state, schemas, or destructive behavior.

## Requirements

- REQ-158-001: When external RAG returns one or more usable product IDs, the search candidate predicate must contain only the product-ID membership predicate and must not contain the local `ILIKE`/`EXISTS` fallback.
- REQ-158-002: When RAG returns an empty array, a non-array payload, a non-success response, or throws, the existing local fallback predicate must be used.
- REQ-158-003: The selected predicate must be applied consistently to both the paginated product query and total-count query.
- REQ-158-004: Exact active-brand matching must retain its existing brand-ID predicate and must not enter the RAG/fallback branch.
- REQ-158-005: Existing non-search filters, explicit sorting, RAG relevance ordering, pagination, and response shaping must remain unchanged.
- REQ-158-006: RAG-success candidate semantics intentionally become RAG-only; every valid RAG candidate remains eligible subject to existing filters, while lexical-only rows outside the RAG candidate set are intentionally excluded.
- REQ-158-007: No schema, index, external API, timeout, retry, analytics, or raw-SQL interpolation change may be introduced.

## Scenarios

- SCN-158-001: RAG returns one valid candidate ID; both data and count WHERE clauses use candidate-ID membership without local fallback predicates.
- SCN-158-002: RAG returns multiple candidate IDs; existing RAG relevance ordering and all downstream filters continue to apply to that candidate set.
- SCN-158-003: RAG returns an empty array or unusable non-array payload; local title, description, metadata, brand, category, subcategory, and product-type matching remains available exactly as before.
- SCN-158-004: RAG responds non-OK or fetch/parse processing throws; search degrades to the existing local fallback rather than failing closed or returning an unfiltered catalog.
- SCN-158-005: Search exactly matches an active brand; the existing exact-brand branch remains unchanged.
- SCN-158-006: Staging query plans for RAG-hit and RAG-fallback cases demonstrate branch exclusivity and results conform to the clarified candidate-source contract.

## Invariants

- INV-158-001: Exactly one candidate-source predicate is selected for a non-exact-brand search: RAG IDs when non-empty, otherwise local fallback.
- INV-158-002: External RAG failure never removes the local catalog fallback.
- INV-158-003: Product data and total count are derived from the same WHERE clause.
- INV-158-004: Explicit customer filters and sort choices retain their current behavior.
- INV-158-005: External RAG values continue through parameterized membership filtering; this task adds no raw SQL construction.

## Flows

- FLOW-158-001: Non-empty search -> no exact brand -> RAG returns IDs -> choose ID-membership predicate -> execute data and count queries -> apply existing response shaping.
- FLOW-158-002: Non-empty search -> no exact brand -> RAG empty/unusable/fails -> choose existing local fallback predicate -> execute data and count queries -> apply existing response shaping.
- FLOW-158-003: Non-empty search -> exact active brand -> choose existing brand-ID predicate -> skip RAG candidate selection.

## Dependencies and integrations

- DEP-158-001: Drizzle query composition in `getProducts()`. Status: existing/resolved. The same composed WHERE clause feeds both data and count operations.
- DEP-158-002: Staging catalog and database access. Status: required for final performance validation; representative RAG-hit and fallback cases must be controllable without production mutation.
- INT-158-001: Advanced RAG search endpoint. Existing contract: a successful array response contributes item `id` values; empty/unusable/error responses leave `ragProductIds` empty. Failure behavior remains local fallback. No retry/idempotency change.

## Personas and boundaries

- PER-158-001: Customer searching the public product catalog.
- SEC-158-001: The external RAG response crosses into database predicate construction. Candidate IDs must continue to use Drizzle parameterization for membership checks, and REN-158 must not add raw interpolation.

## Business rules

- BR-158-001: A non-empty RAG candidate list is authoritative for candidate membership; local lexical matching is a fallback only when no RAG candidates are available.
- BR-158-002: Existing catalog eligibility filters can still remove RAG candidates, and existing sort rules determine their final order.

## Decisions

- DEC-158-001: Interpret “search results unchanged in content” as preserving valid RAG candidates, their established ordering, and fallback-case behavior—not preserving lexical-only additions on RAG success. Class B / RECOMMEND_CONTINUE. This follows the issue’s explicit RAG-only target; lexical-only exclusion is the intended semantic effect.
- DEC-158-002: Keep the implementation at the smallest query-composition boundary. A pure helper may be extracted only if needed to test branch selection without coupling tests to source text. Class A / AUTO_DECIDE.
- DEC-158-003: Use `EXPLAIN (ANALYZE, BUFFERS)` in staging where permitted, with representative RAG-hit and fallback inputs; do not execute it against production as part of this task. Class B / RECOMMEND_CONTINUE.

## Test expectations

- TEXP-158-001: Focused automated test proves a non-empty RAG ID list selects only the ID-membership predicate and never combines the fallback. Category: unit; REQUIRED.
- TEXP-158-002: Focused automated tests prove empty/unusable/non-OK/thrown RAG outcomes retain the existing fallback selection. Category: regression; REQUIRED.
- TEXP-158-003: Regression verification covers exact-brand behavior, explicit sort behavior, RAG relevance ordering, and common catalog filters. Category: integration; REQUIRED.
- TEXP-158-004: Staging `EXPLAIN (ANALYZE, BUFFERS)` confirms the RAG-hit plan contains no local `ILIKE` or correlated search `EXISTS` branch, while the fallback plan still contains it. Category: performance; REQUIRED.
- TEXP-158-005: Staging result comparison confirms RAG-returned candidates remain eligible and ordered as before, fallback results remain unchanged, and lexical-only rows are excluded on RAG success by design. Category: integration; REQUIRED.
- TEXP-158-006: Run `bun test` and the task-local governance validator after implementation. Category: regression; REQUIRED.

## Traceability

| Requirement | Scenarios                             | Tests                                    |
| ----------- | ------------------------------------- | ---------------------------------------- |
| REQ-158-001 | SCN-158-001, SCN-158-002              | TEXP-158-001, TEXP-158-004               |
| REQ-158-002 | SCN-158-003, SCN-158-004              | TEXP-158-002, TEXP-158-004               |
| REQ-158-003 | SCN-158-001, SCN-158-003              | TEXP-158-001, TEXP-158-002, TEXP-158-004 |
| REQ-158-004 | SCN-158-005                           | TEXP-158-003                             |
| REQ-158-005 | SCN-158-002, SCN-158-005              | TEXP-158-003, TEXP-158-005               |
| REQ-158-006 | SCN-158-001, SCN-158-002, SCN-158-006 | TEXP-158-001, TEXP-158-005               |
| REQ-158-007 | SCN-158-001, SCN-158-004              | TEXP-158-003, TEXP-158-006               |

| Scenario    | Invariants                                         |
| ----------- | -------------------------------------------------- |
| SCN-158-001 | INV-158-001, INV-158-003, INV-158-005              |
| SCN-158-002 | INV-158-001, INV-158-004                           |
| SCN-158-003 | INV-158-001, INV-158-002, INV-158-003              |
| SCN-158-004 | INV-158-001, INV-158-002                           |
| SCN-158-005 | INV-158-004                                        |
| SCN-158-006 | INV-158-001, INV-158-002, INV-158-003, INV-158-004 |

## Approval gate

No unresolved design blocker remains. Because this is L2, the independent read-only Critic review is recorded in `CRITIQUE.md`. Ayan Ganguly explicitly approved this contract on 2026-09-09. Implementation may begin and must be followed by `renivet-review REN-158`.
