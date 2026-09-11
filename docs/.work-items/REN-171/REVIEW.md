# REVIEW: REN-171 — Unauthenticated `/api/permission` endpoint leaks PII

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `NO_DRIFT`; governance re-entry is not required. Compared `origin/master` commit `5dc0647404697524eaade1202f50eb7590f42915` with implementation commit `c3a3e29451cf883a77c839109a97ac65cb09d7b6`.

## Review Scope and Git Evidence

The review covers the approved REN-171 contract and the base-to-head diff for the permission route, middleware consumer, policy helper/tests, and task-local governance artifacts. The working tree was clean at review start. No PR exists yet.

## Requirement Reconciliation

- `REQ-171-001`: PASS. `route.ts` calls `auth()` before cache, Clerk, or database access and raises `UNAUTHORIZED` when no session user exists.
- `REQ-171-002`: PASS. `resolvePermissionUserId` returns the authenticated ID; the route uses it for every lookup and profile insert, ignoring query-string identity.
- `REQ-171-003`: PASS. The authenticated local-profile fallback remains and middleware reads the session user from `userCache` for dashboard routing.
- `REQ-171-004`: PASS. The route returns `buildPermissionResponse(isAuthorized)` rather than `existingUser`.
- `REQ-171-005`: PASS. Existing `handleError` containment remains in the route and middleware redirects on API errors.

## Scenario Reconciliation

- `SCN-171-001`–`SCN-171-003`: PASS by route control flow and policy tests; unauthenticated identity resolves to null, authenticated identity overrides the supplied ID, and the response builder has no PII fields.
- `SCN-171-004`: PASS by middleware consumer update and preserved permission calculation using the authenticated cache record.
- `SCN-171-005`: PASS by the route’s Clerk fallback using the authenticated `userId`.
- `SCN-171-006`: PARTIAL; the existing error path is preserved, but no direct integration harness exercises every external dependency failure.

## Invariant Reconciliation

- `INV-171-001`–`INV-171-003`: PASS by the early auth guard, authenticated-ID lookups, and verdict-only response.
- `INV-171-004`–`INV-171-005`: PASS by existing error handling and middleware redirect behavior.

## Flow and Architecture Review

- `FLOW-171-001` and `FLOW-171-002`: PASS. The route owns authentication and verdict computation; middleware retains server-side user data only for its existing dashboard routing needs. No schema or migration change is present.
- `DEP-171-001`, `DEP-171-002`, and `INT-171-001`: PASS by direct Clerk session binding, cookie forwarding for middleware’s internal request, cache lookup, and conflict-safe fallback.

## Security and Integration Review

- `SEC-171-001` and `BR-171-001`: PASS. The query-string user ID is no longer a trust boundary, and the response no longer serializes profile data.
- The internal middleware request forwards the current request cookie so the route’s direct Clerk `auth()` check can succeed; the middleware then loads the already-authorized session user from cache rather than consuming PII from the API response.

## Scope and Drift Review

`NO_DRIFT`. Changed files are limited to the approved permission route, its middleware consumer, focused policy helper/tests, and REN-171 governance artifacts. No schema, migration, production configuration, unrelated API, or permission definition changed.

## Test Expectation Review

- `TEXP-171-001`: PARTIAL. Policy tests cover unauthenticated identity resolution, but no direct route invocation asserts HTTP 401.
- `TEXP-171-002`: PASS/PARTIAL. Policy tests cover session-over-query identity and implementation inspection covers fallback and middleware compatibility; direct external integration coverage is incomplete.
- `TEXP-171-003`: PASS/PARTIAL. Verdict-only response tests assert no PII shape; dependency-failure behavior is supported by existing route handling but not directly exercised here.
- `TEXP-171-004`: PASS/PARTIAL. Middleware response typing and cache usage preserve the consumer contract; a full middleware integration harness is absent.

## Findings

### REV-171-001

- Severity: LOW
- Category: test
- Description: Direct route-level and middleware integration tests are not present for Clerk, cache, database fallback, and HTTP status behavior.
- Evidence: `TEXP-171-001`–`TEXP-171-004`; `src/app/api/permission/permission-policy.test.ts`; changed symbols `GET` in `route.ts` and the middleware `cFetch` call.
- Impact: Future changes could regress the adapter wiring even though the pure identity/response policy is covered.
- Recommendation: Add a dependency-injected route harness covering 401, cross-user query attempts, fallback provisioning, forbidden verdicts, and dependency failures.

## Decisions Requiring Attention

None.

## Final Recommendation

The implementation matches the approved security contract with no material drift or blocking findings. Merge may proceed after normal CI review. Track `REV-171-001` as a non-blocking follow-up for stronger route-level integration coverage.
