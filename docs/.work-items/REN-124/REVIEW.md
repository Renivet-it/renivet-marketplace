# REVIEW: REN-124 — Build systematic IDOR test matrix

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS` with `NO_DRIFT`. The two blocking target-binding defects from the previous review are corrected. The matrix now targets the real order route and the corporate quote browser path consumes the requested quote identifier before rendering the resource-specific details state. Governance re-entry is no longer required. Compared commits: base `4e27098fb3d518671b4ce8abaecf9988d9a776df`, head `ebfbd63d0759cdeec3b07cdccbc5ef7452454d27`, PR #649.

## Review Scope and Git Evidence

- Linear issue REN-124 matches the work-item directory, `task.id`, branch, and PR.
- The approved work item remains `READY_FOR_DEV`/`APPROVED` as the contract source; the prior review correctly placed the task in `IN_REVIEW` for re-entry.
- Compared `origin/master...HEAD`: twelve changed paths, including the matrix, both runners, focused tests, runbook, package scripts, governance artifacts, and the corporate quote page/component touched to make the approved UI target resource-specific.
- The worktree was clean after commit `ebfbd63d` was pushed.

## Requirement Reconciliation

- `REQ-001` — PASS. The manifest covers all six resources and four access modes. Orders target `/orders/{orderId}`. Corporate quote cases target `/profile/corporate?quoteId={quoteId}`; the page filters `listMyQuotes` to the requested ID and passes the binding into `CustomerCorporateDashboard`.
- `REQ-002` — PASS by static inspection. UI-reachable order, quote, and cart cases use the browser runner; API-only invoice, payment-request, and address cases use the direct HTTP runner.
- `REQ-003` — PASS by static inspection. Typed fixtures, GET-only enforcement, nonzero mismatch handling, execution-error handling, and browser cleanup remain fail-closed.
- `REQ-004` — PASS by static inspection. Positive origin allowlisting, non-local acknowledgement, redirect-origin checks, redacted evidence, and isolated browser sessions remain enforced.
- `REQ-005` — PASS. The runbook documents fixtures, commands, classifications, evidence, cleanup, runtime assumptions, and operator/CI usage.
- `REQ-006` — PASS. Capability-token semantics remain explicit and payment-request POST mutations remain excluded.

## Scenario Reconciliation

- `SCN-001` — PASS. Matrix completeness and browser route-binding regression coverage are present in `scripts/security/idor-test-matrix.test.ts`.
- `SCN-002` — PASS by static inspection. Protected browser/API surfaces and public capability behavior retain their declared channels and outcomes.
- `SCN-003` — PASS by static inspection. The wrong-user and tampered quote paths no longer render an unrelated quote because the page filters by the requested identifier; the browser runner classifies an absent resource as forbidden without collecting content.
- `SCN-004` — PASS by static inspection. Owner order cases resolve through `/orders/{id}` and owner quote cases open the requested quote details state.
- `SCN-005` — PASS by static inspection. Tampered order IDs are inserted into the real order route; tampered quote IDs are consumed by the page and produce no resource-found signal.
- `SCN-006` — PASS. Browser sessions remain isolated and cleaned up; HTTP evidence remains redacted.
- `SCN-007` — PASS. Unsafe origins and redirects remain blocked.
- `SCN-008` — PASS. Transport, malformed-response, fixture, and cleanup failures remain errors.
- `SCN-009` — PASS. The runbook remains reproducible without committed secrets.
- `SCN-010` — PASS by static inspection. Customer, brand, unrelated-brand, and admin cases retain explicit persona/scope metadata and the quote target is resource-bound.
- `SCN-011` — PASS for invoice/payment capability classification by static inspection.
- `SCN-012` — PASS. Fixture ownership/status validation and drift failures remain explicit.

## Invariant Reconciliation

- `INV-001` — PASS. Every case has complete metadata and target binding; the focused test asserts the real order pathname and quote query identifier.
- `INV-002` — PASS. Only GET cases execute and target safety remains enforced.
- `INV-003` — PASS. No credentials, tokens, response bodies, or browser state paths enter evidence.
- `INV-004` — PASS. Authorization outcomes and execution errors remain distinct.
- `INV-005` — PASS. Owner and negative controls now use the same resource-specific order/quote bindings.
- `INV-006` — PASS. Payment POST actions remain absent.
- `INV-007` — PASS. Fixture drift and ambiguous responses still invalidate execution.

## Flow and Architecture Review

The approved flow remains target/fixture validation → manifest validation → channel-specific read-only execution → normalized redacted evidence → exit/report. The order fix is a manifest correction. The quote fix makes the already-declared `quoteId` UI target meaningful by filtering the existing owner-scoped quote list, initializing the matching details state, and exposing only a boolean resource-presence attribute to the browser harness. No new dependency, schema, mutation, or authorization bypass was added.

## Security and Integration Review

- `SEC-001` — PASS. Origin allowlisting and redirect enforcement are unchanged.
- `SEC-002` — PASS. Fixture secrets and response content remain in memory or are redacted.
- `SEC-003` — PASS. Missing fixtures, transport failures, cleanup failures, and absent quote resources cannot become authorization passes.
- `INT-001` — PASS by static inspection. Direct HTTP/tRPC construction remains separate from browser execution.
- `INT-002` — PASS by static inspection. Browser state isolation, bounded waits, final-origin checks, and cleanup handling remain present.
- `DEP-001` through `DEP-005` — PASS by static inspection. The corrected order route and quote identifier consumption now align the manifest with the repository's UI contracts.

## Scope and Drift Review

`NO_DRIFT`. The changed UI code only implements the identifier binding already required by the approved browser target; it does not add a new endpoint, schema, dependency, mutation, authorization policy, or production configuration. No unrelated files were changed.

## Test Expectation Review

- `TEXP-001` — PASS by static inspection. Matrix, target-safety, normalization, redaction, and fixture checks are covered.
- `TEXP-002` — PARTIAL. The direct HTTP runner and deterministic request construction are present; live fixture execution is operator-provisioned and is not evidenced in the repository review.
- `TEXP-003` — PASS by static inspection. Browser route/resource binding is covered by the focused regression test and runner resource-presence classification.
- `TEXP-004` — PASS. Safety and fail-closed behavior remain represented.
- `TEXP-005` — PASS. The runbook provides the operator workflow.
- `TEXP-006` — PASS by static inspection. Capability, role/scope, fixture, and payment mutation boundaries are represented.
- `TEXP-007` — PASS. Timeout and cleanup behavior remain implemented.

## Findings

### REV-003

- Severity: LOW
- Category: test
- Description: Live staging/API/browser fixture execution is not part of this repository review evidence.
- Evidence: `TEXP-002`; `scripts/security/run-idor-api-matrix.ts`; `scripts/security/run-idor-browser-matrix.ts`; the runbook's operator-provisioned fixture contract.
- Impact: Runtime authorization results still require a safe local/staging fixture run before being treated as security findings or passes.
- Recommendation: Run both matrix commands with isolated local/staging fixtures and attach only the redacted JSON reports.

## Decisions Requiring Attention

None. Existing `DEC-001` and `DEC-002` remain resolved.

## Final Recommendation

The previous blockers `REV-001` and `REV-002` are resolved. PR #649 is ready for maintainer review. A live local/staging fixture run remains recommended before merge; it is non-blocking and fails closed when its required environment is absent.
