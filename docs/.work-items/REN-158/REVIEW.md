# REVIEW: REN-158 — Skip the unindexed ILIKE fallback query when the external RAG search already returned candidates

## Executive Result

Result: `REVIEW_PASSED_WITH_FINDINGS`  
Drift: `NO_DRIFT`  
Base: `origin/master` at `e9afd760417a095b041c73c59f11d85fd2b88525`  
Head: `994ae0c96960fefe710b3f1066f5a9a8852ec312`  
Governance re-entry required: no.

The committed implementation follows the approved exclusive-predicate design. Static test coverage demonstrates the emitted Drizzle SQL for RAG-hit and empty-candidate branches. Required staging plan/result evidence is not present in the repository and remains a pre-merge verification action.

## Review Scope and Git Evidence

- Linear identity, requested ID, work-item directory, and `task.id` all resolve to `REN-158`; Linear has no comments or blocking relations.
- The approved contract passed governance validation before review with `task.status: READY_FOR_DEV` and `approval.state: APPROVED`.
- Compared merge base `e9afd760417a095b041c73c59f11d85fd2b88525` to committed head `994ae0c96960fefe710b3f1066f5a9a8852ec312`; the worktree was clean when the comparison was established.
- Implementation paths are `src/lib/db/queries/product.ts`, `product-search-predicate.ts`, and `product-search-predicate.test.ts`; task-local governance artifacts are the only other changed paths.

## Requirement Reconciliation

- `REQ-158-001`: PASS. `getCatalogSearchPredicate()` returns `inArray(products.id, ragProductIds)` immediately for a non-empty list; the compiled-SQL test excludes `ILIKE`, `EXISTS`, and the lexical pattern.
- `REQ-158-002`: PASS for implementation. Existing non-array, non-OK, and thrown RAG handling leaves `ragProductIds` empty; the helper then builds the unchanged four-`ILIKE`/four-`EXISTS` fallback. Automated coverage directly exercises the empty-list boundary.
- `REQ-158-003`: PASS. `getProducts()` assigns the helper result to `searchQuery`, includes it once in `filters`, and reuses one `whereClause` for data and count queries. The test compiles both query forms from one predicate.
- `REQ-158-004`: PASS. The exact-brand branch is unchanged and still assigns `eq(products.brandId, exactBrand.id)` before the RAG branch.
- `REQ-158-005`: PASS. Filters, ordering, pagination, response shaping, and `shouldApplySearchRelevanceOrdering()` are unchanged.
- `REQ-158-006`: PASS. Non-empty candidates now produce RAG-only membership, subject to the unchanged downstream filters and ordering.
- `REQ-158-007`: PASS. No schema, index, API, timeout, retry, analytics, dependency, or new raw-SQL interpolation change appears in the diff.

## Scenario Reconciliation

- `SCN-158-001`: PASS. One or more IDs take the same tested non-empty branch used by data and count SQL.
- `SCN-158-002`: PASS. Multiple IDs are parameterized; existing RAG ordering and catalog filters remain downstream and unchanged.
- `SCN-158-003`: PASS. Empty IDs compile the complete existing fallback shape.
- `SCN-158-004`: PASS for code path. Non-OK and thrown outcomes still leave the initialized empty array and reach fallback; dedicated failure-outcome automation is not added.
- `SCN-158-005`: PASS. Exact-brand control flow is untouched.
- `SCN-158-006`: PARTIAL. Compiled SQL proves branch exclusivity, but staging query-plan and result-comparison evidence is absent.

## Invariant Reconciliation

- `INV-158-001`: PASS. The helper returns either ID membership or fallback, never their union.
- `INV-158-002`: PASS. Existing integration failures preserve an empty candidate array and therefore select fallback.
- `INV-158-003`: PASS. One `whereClause` remains shared by data and count queries.
- `INV-158-004`: PASS. Filters and explicit sorting are outside the changed hunk.
- `INV-158-005`: PASS. Candidate membership uses Drizzle `inArray`; no new `sql.raw` call exists.

## Flow and Architecture Review

- `FLOW-158-001`: PASS. RAG candidates flow through the new helper into the shared query predicate.
- `FLOW-158-002`: PASS. Empty/failure state flows through the helper into the copied local fallback predicate.
- `FLOW-158-003`: PASS. Exact active-brand flow remains before and outside helper invocation.
- `DEP-158-001`: PASS. The existing Drizzle composition boundary is preserved and made independently testable.
- `DEP-158-002`: PARTIAL. The implementation does not require a staging code change, but staging verification evidence has not been supplied.

## Security and Integration Review

- `SEC-158-001`: PASS. RAG IDs enter SQL through parameterized `inArray`; the test inspects bound parameters and no new raw interpolation is added.
- `INT-158-001`: PASS. Endpoint URL, response handling, revalidation, retries, and error behavior are unchanged. The integration still normalizes successful array IDs and leaves the candidate list empty for other outcomes.
- `BR-158-001` and `BR-158-002`: PASS. Candidate-source authority changes exactly as approved while downstream catalog rules remain intact.

## Scope and Drift Review

The implementation stays within the approved query-composition and test boundaries. Extracting the fallback into a focused helper is permitted by `DEC-158-002`. Import reordering in `product.ts` is formatter-only. No excluded subsystem or public contract changed. Classification: `NO_DRIFT`.

## Test Expectation Review

- `TEXP-158-001`: PASS. The new test compiles real Drizzle data/count SQL and proves non-empty IDs exclude lexical predicates.
- `TEXP-158-002`: PARTIAL. Empty-list fallback is directly tested; non-array, non-OK, and thrown integration outcomes are supported by unchanged control flow but lack dedicated automated cases.
- `TEXP-158-003`: PASS by static evidence. Exact-brand/filter paths are unchanged, and the existing `product-ordering.test.ts` protects explicit-versus-RAG ordering decisions.
- `TEXP-158-004`: PARTIAL. Compiled SQL confirms predicate shape, but required staging `EXPLAIN (ANALYZE, BUFFERS)` evidence is absent.
- `TEXP-158-005`: PARTIAL. Static semantics match the contract, but required staging result comparison is absent.
- `TEXP-158-006`: PASS by test inventory and governance artifact presence; REVIEW does not execute or claim runtime suite results.

## Findings

### REV-158-001

- Severity: LOW
- Category: test
- Description: Dedicated automation covers empty RAG candidates but not non-array, non-OK, or thrown external outcomes.
- Evidence: `TEXP-158-002`; `product-search-predicate.test.ts` tests `ragProductIds: []`, while `product.ts` retains the untested integration branches.
- Impact: A future refactor could regress fallback assignment for an external failure without the focused predicate tests detecting it.
- Recommendation: Add focused integration-boundary cases when the external response parsing is next isolated; retain the current empty-boundary regression as the query-composition guard.

### REV-158-002

- Severity: MEDIUM
- Category: test
- Description: Required staging query-plan and result-comparison evidence is unavailable in the branch.
- Evidence: `SCN-158-006`, `DEP-158-002`, `TEXP-158-004`, and `TEXP-158-005` require staging evidence; no such artifact or controlled staging output is present.
- Impact: The emitted SQL shape is proven, but planner-level performance and representative staging result behavior are not yet evidenced.
- Recommendation: Before merge, run the approved RAG-hit and fallback staging checks and attach their sanitized results to the PR or task.

## Decisions Requiring Attention

None. `DEC-158-001`, `DEC-158-002`, and `DEC-158-003` are implemented within their approved design freedom.

## Final Recommendation

No governance re-entry is required and no code blocker was found. Before merge, collect the staging evidence described by `REV-158-002`. `REV-158-001` is a non-blocking coverage improvement because the external failure paths are unchanged and converge on the directly tested empty-list boundary.
