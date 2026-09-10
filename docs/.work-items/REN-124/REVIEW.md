# REVIEW: REN-124 — Build systematic IDOR test matrix

## Executive Result

`REVIEW_FAILED` with `MATERIAL_DRIFT`. The harness architecture and safety controls are largely present, but two browser manifest targets do not exercise the resources claimed by the approved contract. Governance re-entry is required before merge. Compared commits: base `4e27098fb3d518671b4ce8abaecf9988d9a776df`, head `47e983efb0eebeaacf672d9429020c76df81a435`, PR #649.

## Review Scope and Git Evidence

- Linear issue REN-124 matches the work-item directory, `task.id`, branch, and PR.
- The approved work item is `READY_FOR_DEV`, `APPROVED`, and has no design blockers before this review.
- Compared `origin/master...HEAD`: nine changed paths, including the matrix, both runners, tests, runbook, package scripts, and governance artifacts.
- The worktree was clean at review time.

## Requirement Reconciliation

- `REQ-001` — FAIL. The manifest contains the requested resources and modes, but the order browser target points to `/profile/orders/{orderId}` while the implemented UI route is `src/app/(protected)/orders/[id]/page.tsx`, so the order cases do not exercise the intended resource. The corporate quote target adds `quoteId` to `/profile/corporate`, but `src/app/(protected)/profile/corporate/page.tsx` does not read query parameters and always loads the current user's full quote list; tampered quote cases therefore do not address a specific quote.
- `REQ-002` — PARTIAL. HTTP cases use direct API/tRPC builders and browser cases use `agent-browser`, but the two incorrect browser targets prevent complete channel coverage.
- `REQ-003` — PASS by static inspection. Typed fixture validation, read-only GET enforcement, nonzero mismatch handling, and execution-error handling are present in `scripts/security/idor-test-matrix.ts`, `run-idor-api-matrix.ts`, and `run-idor-browser-matrix.ts`.
- `REQ-004` — PASS by static inspection. Positive origin allowlisting, non-local acknowledgement, redirect-origin checks, redacted evidence, and cleanup handling are implemented.
- `REQ-005` — PASS. `docs/runbooks/REN-124-IDOR-MATRIX.md` documents fixture setup, commands, classifications, evidence, cleanup, runtime assumptions, and CI/operator use.
- `REQ-006` — PASS. Payment-request POST actions are excluded and documented as a separate mocked/idempotency scope.

## Scenario Reconciliation

- `SCN-001` — PARTIAL. Matrix completeness is validated, but target correctness is not validated against repository route ownership.
- `SCN-002` — PARTIAL. HTTP capability cases are represented; order and corporate quote browser cases cannot currently establish the intended resource outcome.
- `SCN-003` — FAIL for order/quote browser cases because the wrong order route and non-resource-specific quote page can produce false denials or false passes.
- `SCN-004` — FAIL for order/quote browser cases for the same target reason.
- `SCN-005` — FAIL for tampered order/quote browser cases because the target does not reliably bind the requested identifier.
- `SCN-006` — PASS by static inspection. Browser sessions are isolated by persona and closed with cleanup failure handling; HTTP output is redacted.
- `SCN-007` — PASS by static inspection. Unsafe origins and redirects are rejected before result acceptance.
- `SCN-008` — PASS by static inspection. Transport, malformed-response, and fixture failures are classified as errors.
- `SCN-009` — PASS. The runbook supports reproducible operator execution without committing secrets.
- `SCN-010` — PARTIAL. Brand/admin cases are represented, but corporate quote target binding remains non-specific.
- `SCN-011` — PASS for invoice/payment capability cases by static inspection.
- `SCN-012` — PASS by static inspection. Fixture ownership/status validation and drift failures are explicit.

## Invariant Reconciliation

- `INV-001` — PASS for metadata completeness; target-to-resource correctness is not enforced.
- `INV-002` — PASS by static inspection. Only GET cases are permitted and target safety is checked.
- `INV-003` — PASS by static inspection. Evidence excludes response bodies, cookies, tokens, and state paths.
- `INV-004` — PASS by static inspection. HTTP/tRPC/browser outcomes remain distinct and errors are not coerced into denials.
- `INV-005` — FAIL for order and quote browser cases because positive and negative controls do not bind to the intended resource route/identifier.
- `INV-006` — PASS. Payment POST actions are not represented as executable cases.
- `INV-007` — PASS by static inspection. Fixture drift and ambiguous responses invalidate execution.

## Flow and Architecture Review

The approved flow exists: target/fixture validation → manifest validation → channel-specific read-only execution → redacted report. The implementation uses the correct separation between direct HTTP and browser runners. However, the manifest is not sufficiently connected to actual UI routes for two resource families, which is a material test-strategy defect rather than an architectural expansion.

## Security and Integration Review

- `SEC-001` — PASS by static inspection. The positive origin allowlist and redirect checks are implemented.
- `SEC-002` — PASS by static inspection. Sensitive fixture material is used in memory and excluded from result fields.
- `SEC-003` — PASS by static inspection. Missing fixtures, transport errors, and cleanup failures do not become authorization passes.
- `INT-001` — PARTIAL. Direct HTTP/tRPC request construction is present, but browser route/resource binding is incomplete.
- `INT-002` — PASS by static inspection. Browser state isolation, bounded waits, final-origin checks, and cleanup aggregation are present.
- `DEP-001` through `DEP-005` — PARTIAL overall because the fixture and response contracts cannot compensate for incorrect UI target paths.

## Scope and Drift Review

No unauthorized application behavior, schema, dependency, or production configuration was added. The defect is material drift from the approved requirement that each resource/access-mode case exercise the owned resource. Governance re-entry is required; no implementation fix was made during REVIEW.

## Test Expectation Review

- `TEXP-001` — PASS by static inspection. Deterministic matrix, target-safety, normalization, redaction, and fixture checks are covered by `scripts/security/idor-test-matrix.test.ts`.
- `TEXP-002` — PARTIAL. The direct HTTP runner is implemented, but no live fixture execution is evidenced in the repository review.
- `TEXP-003` — FAIL for the incorrect order and quote browser targets; the runner exists, but those cases cannot test the intended resources.
- `TEXP-004` — PASS by static inspection. Safety and fail-closed behavior are represented.
- `TEXP-005` — PASS. The runbook provides the operator workflow.
- `TEXP-006` — PARTIAL. Scope/capability metadata exists, but quote target binding is incomplete.
- `TEXP-007` — PASS by static inspection. Timeout and cleanup behavior are implemented.

## Findings

### REV-001

- Severity: BLOCKER
- Category: test
- Description: The order browser cases target `/profile/orders/{orderId}`, but the resource UI route is `/orders/[id]`.
- Evidence: `REQ-001`, `SCN-003`–`SCN-005`, `TEXP-003`; `scripts/security/idor-test-matrix.ts` `definitions.order.target`; `src/app/(protected)/orders/[id]/page.tsx`.
- Impact: Owner controls can be classified as not found and negative cases can pass for the wrong reason, so the matrix does not establish order IDOR behavior.
- Recommendation: Correct the order target to the actual UI route and add a route-target contract test before rerunning REVIEW.

### REV-002

- Severity: BLOCKER
- Category: test
- Description: Corporate quote browser cases append `quoteId` to `/profile/corporate`, but the page ignores that query parameter and loads the current user's quote list.
- Evidence: `REQ-001`, `SCN-010`, `TEXP-003`; `scripts/security/idor-test-matrix.ts` `definitions.corporate_quote.target`; `src/app/(protected)/profile/corporate/page.tsx` calls `listMyQuotes(userId)` without reading `quoteId`.
- Impact: Tampered-identifier and cross-scope quote cases do not probe a specific quote and can produce false security conclusions.
- Recommendation: Bind the quote case to an actual UI interaction/resource route, or route it through a direct quote API procedure that accepts and authorizes the quote identifier; add a contract test proving the identifier is consumed.

## Decisions Requiring Attention

None. Existing `DEC-001` and `DEC-002` remain resolved; the findings are implementation corrections, not new human-confirmation decisions.

## Final Recommendation

Do not merge PR #649 yet. Correct `REV-001` and `REV-002`, add target-binding regression tests, rerun the full verification suite, and rerun REN-124 REVIEW. Governance re-entry is required because the current matrix cannot reliably test all approved resource/access-mode cases.
