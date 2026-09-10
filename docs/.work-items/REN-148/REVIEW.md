# REVIEW: REN-148 — Confirm/schedule sync cadence for the external search index

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS` with `MINOR_DRIFT` limited to evidence/coverage follow-up. The implementation remains within the approved REN-148 contract and has no blocking finding or governance re-entry requirement. The comparison is against `master` commit `4e27098fb3d518671b4ce8abaecf9988d9a776df` and implementation commit `3b81acf058d07dbd15d3cd29fa7a2240ac121f96` in PR #648.

## Review Scope and Git Evidence

- Linear issue: REN-148, matching `task.id`, work-item directory, and branch.
- PR: https://github.com/Renivet-it/renivet-marketplace/pull/648
- Compared diff: `origin/master...HEAD`; nine changed paths, including the task-local governance artifacts, cron route, sync service, provider client, manual script, tests, and runbook.
- Worktree was clean at review time.
- The approved work item is `READY_FOR_DEV`, `APPROVED`, and has no design blockers.

## Requirement Reconciliation

- `REQ-001` — PASS. `syncProductEmbeddings` selects active, published, non-deleted products with either target vector missing, orders by product ID, and limits the batch to 25. `isEligibleForEmbeddingSync` and `buildEmbeddingSyncPlan` provide the corresponding pure planning behavior in `src/lib/search/embedding-sync.ts`.
- `REQ-002` — PASS. `src/app/api/cron/search-embedding-sync/route.ts` uses the existing bearer secret guard; `syncProductEmbeddings` uses a PostgreSQL transaction advisory lock, per-dimension failure isolation, a 15-second provider timeout from `src/lib/python/sematic-search.ts`, and three total attempts.
- `REQ-003` — PASS. The route returns counters only, adds `Cache-Control: no-store`, and suppresses provider error details. `getEmbeddingSyncResult` excludes vector payloads.
- `REQ-004` — PASS. Existing manual entry points remain present; `generate-semantic-embeddings.ts` now calls `getEmbedding768`, while the external RAG query path is not changed by this diff.
- `REQ-005` — PASS. `docs/runbooks/SEARCH_EMBEDDING_SYNC.md` documents the daily 02:00 Asia/Kolkata cadence, 10-minute scheduler timeout, retry/concurrency behavior, and authenticated GET request.

## Scenario Reconciliation

- `SCN-001` — PASS. Eligibility, deterministic ordering, and batch size are implemented in the sync service.
- `SCN-002` — PASS. Each product continues after provider failure, retries independently, and persists whichever dimension succeeds; later runs can retry failed dimensions.
- `SCN-003` — PASS. Authorization is checked before the sync service is invoked.
- `SCN-004` — PASS. Successful and advisory-lock-skipped runs return the approved counters without vectors.
- `SCN-005` — PASS. Manual semantic and suggestion scripts remain in place, and no external RAG query implementation is modified.
- `SCN-006` — PARTIAL. The operator-facing cadence and request are documented, but production scheduler registration and secret provisioning are explicitly external deployment-operator work and are not represented in this repository diff.

## Invariant Reconciliation

- `INV-001` — PASS. Selection and update predicates both require active, published, non-deleted rows and re-check missing-vector state before writing.
- `INV-002` — PASS. Provider failures are caught per product and dimension; processing continues for the remainder of the bounded plan.
- `INV-003` — PASS. The route rejects unauthorized requests before database or provider work, and the sync response does not expose vectors.
- `INV-004` — PASS. The diff adds a synchronization path but does not modify the external RAG query path or its ordering.

## Flow and Architecture Review

`FLOW-001` is implemented as authenticated request → transaction-scoped advisory lock → deterministic eligible selection → bounded provider calls → eligibility-rechecked updates → counter response. The new route delegates to `src/lib/search/embedding-sync.ts`; the existing provider client and product schema are reused. No schema, migration, dependency, or direct-pgvector search replacement was added.

## Security and Integration Review

- `SEC-001` — PASS. The route uses the existing `CRON_SECRET` bearer authorization boundary and returns generic failure text. The provider receives product-derived text, while response payloads contain counters only.
- `INT-001` — PASS. Both provider dimensions are mapped to their matching columns, requests have a 15-second timeout, failures retry twice after the initial attempt, and successful dimensions can be persisted independently. The advisory lock and missing-vector predicates provide idempotent overlap protection.
- `DEP-001` through `DEP-003` — PASS. The service uses the existing catalog flags/vector columns, embedding client, and cron authorization helper.
- `DEP-004` — PARTIAL evidence only. The runbook gives the deployment operator the exact schedule/request handoff, but external scheduler registration cannot be verified from this repository.

## Scope and Drift Review

The changed files stay within the approved staged first step: scheduled embedding synchronization and cadence documentation. The external RAG path remains unchanged, and the direct pgvector replacement remains out of scope. No material drift or new human-confirmation decision was observed. The minor finding classification reflects missing repository evidence for externally configured operations, not a contradictory implementation.

## Test Expectation Review

- `TEXP-001` — PASS by static inspection. `src/lib/search/embedding-sync.test.ts` covers eligibility, deterministic bounded planning, dimension-specific text, and counter shape without vectors.
- `TEXP-002` — PARTIAL. The route visibly calls the approved authorization helper and returns the approved response shape, but this diff does not include an API route test covering unauthorized requests, no-store headers, lock-skipped responses, or provider-error responses.
- `TEXP-003` — PASS by static inspection. The manual scripts remain present, the semantic script uses the 768-dimensional provider, and the external RAG query path is absent from the changed paths.
- `TEXP-004` — PARTIAL. The runbook contains the required scheduler configuration, but deployed scheduler registration and secret provisioning require operator evidence outside the repository.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: The approved API-level test expectation is not directly represented by a route test in the implementation diff.
- Evidence: `TEXP-002`; `src/app/api/cron/search-embedding-sync/route.ts`; the only new test file is `src/lib/search/embedding-sync.test.ts`.
- Impact: Route-level authorization, response headers, and error behavior could regress without a focused automated check.
- Recommendation: Add route-level tests for unauthorized access, successful/no-store responses, advisory-lock skips, and generic provider failure responses.

### REV-002

- Severity: LOW
- Category: integration
- Description: Production scheduler registration and CRON_SECRET provisioning are not evidenced in repository state.
- Evidence: `SCN-006`, `TEXP-004`, `DEP-004`; `docs/runbooks/SEARCH_EMBEDDING_SYNC.md` explicitly assigns registration to the deployment operator.
- Impact: The endpoint can exist without being invoked, leaving catalog coverage stale until deployment configuration is completed.
- Recommendation: Record deployment-operator evidence that the daily 02:00 Asia/Kolkata schedule and secret-backed GET request are active.

## Decisions Requiring Attention

None. `DEC-001` is resolved in the approved contract; no new Class C decision was introduced.

## Final Recommendation

Accept the implementation for merge with the two non-blocking follow-ups above. No governance re-entry is required. Complete route-level API coverage and capture deployment scheduler evidence before treating the operational cadence as fully verified.
