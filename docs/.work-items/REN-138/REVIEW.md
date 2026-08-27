# REVIEW: REN-138 — CAPI Execution Path Optimization

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; material drift: `NO_DRIFT`; governance re-entry: `false`. The implementation satisfies the approved bounded-execution, truthful-outcome, lifecycle, compatibility, and dashboard requirements. One non-blocking runtime test-coverage follow-up remains.

## Review Scope and Git Evidence

- Linear issue: REN-138; approved contract: `docs/.work-items/REN-138/work-item.yaml`.
- Base branch and commit: `main`, `52cd5704491e20c3daefacdf81ef20833c4eeb7b`.
- Head commit: `aadbe657c7a29d0bc889ca3b2bfdab3861cd7411`.
- PR: none. The review includes the implementation commits and task-local governance artifacts.
- Changed implementation areas: `src/lib/fb-capi.ts`, `src/actions/analytics.ts`, the product page, the CAPI dashboard projection, and focused tests.

## Requirement Reconciliation

- `REQ-001`–`REQ-003`: PASS — Meta uses an abortable bounded fetch; each database operation has its own deadline and synchronous `cancel()` attempt; Meta and pending insert start independently and are collected with `Promise.allSettled`.
- `REQ-004` and `REQ-008`: PASS — accepted, provider-rejected, timeout, transport, invalid-response, pending, and legacy states are represented and redacted before persistence/logging.
- `REQ-005`: PASS — the existing side-effect gate and token check precede provider and log side effects.
- `REQ-006`–`REQ-007`: PASS — ViewContent captures request data before registering `after()`, public wrappers and payloads remain compatible, and rendering does not await telemetry completion.
- `REQ-009`: PASS — existing event call paths remain covered by the analytics wrappers and source assertions.

## Scenario and Invariant Reconciliation

`SCN-001` through `SCN-010` pass by static inspection and focused tests. `INV-001` through `INV-010` pass: no authorized operation is unbounded, attempts are independent, incomplete persistence remains pending/unknown, business state is untouched, late settlements are observed, timers are cleared, and request APIs are not used inside the scheduled callback.

## Flow, Architecture, Security, and Scope Review

`FLOW-001` and `FLOW-002` match the approved state transitions. The SDK-compatible custom HTTP service preserves provider request semantics while adding `AbortController` cancellation. Drizzle SQL is executed through the existing Postgres client so the query handle can receive the supported synchronous cancellation attempt. Existing server-only token handling, side-effect gating, dashboard authorization, and sanitization remain intact.

`NO_DRIFT`: no schema migration, queue/worker, retry policy, token rotation, pool configuration, gate redesign, order/payment behavior, or customer-response coupling was introduced.

## Test Expectation Review

- `TEXP-001`–`TEXP-006`: PASS — `src/lib/fb-capi.test.ts` covers cancellation, deadlines, timer cleanup, concurrency, failures, gating, redaction, and public failure compatibility.
- `TEXP-007`: PASS — dashboard status projection tests cover typed outcomes, pending, legacy labels, CSV projection, and raw response preservation.
- `TEXP-008` and `TEXP-011`: PASS — analytics tests cover request capture ordering, request-API-free sender mapping, wrapper arity, callback and registration failure containment, and the product-page wiring.
- `TEXP-009` and `TEXP-010`: PARTIAL — the implementation seams are tested deterministically, but a runtime-level Next/Vercel `after()` integration test and deployment latency proof remain operational follow-ups.
- `TEXP-012` and `TEXP-013`: FOLLOW-UP — compare Vercel duration/error signatures and verify deployed abort behavior after release.
- `TEXP-014`: PASS — diagnostics and persisted typed responses are redacted and do not add token exposure.

The follow-up build failure reported by Vercel was fixed in `aadbe657`: synchronous ViewContent helper factories were moved out of the `"use server"` module, leaving its exported actions async as required by Next.js.

## Findings

### REV-001

- Severity: MEDIUM
- Category: test
- Description: The approved integration expectations call for runtime-level ProductFetch/Next lifecycle verification; the current suite uses deterministic seams and source-level wiring assertions.
- Impact: Deployment-specific `after()` liveness and request completion behavior still need confirmation in the target runtime.
- Recommendation: Add a focused runtime integration test, and complete the Vercel liveness/error-signature checks after deployment.

## Decisions Requiring Attention

None. `DEC-001` through `DEC-003` are implemented as approved; timeout tuning and deployed liveness remain evidence-driven follow-ups.

## Final Recommendation

Accept as `REVIEW_PASSED_WITH_FINDINGS` with no governance re-entry. The implementation is ready for normal branch/PR handling; track `REV-001` as a non-blocking follow-up.
