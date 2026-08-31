# REVIEW: REN-111 — Inconsistent guest-redirect behavior across login walls

## Executive Result

REVIEW_BLOCKED. Drift is `NO_DRIFT` based on static inspection only; governance re-entry is not required. A completed comparison is unavailable because the checkout is on `ayanganguly333/ren-131-132-purchase-cart-analytics`, rather than the contract branch `ayanganguly333/ren-111-inconsistent-guest-redirect-behavior-across-login-walls`, and the REN-111 files are uncommitted. Base and head commits are therefore recorded as `null`.

## Review Scope and Git Evidence

The approved work item is REN-111 and validates as READY_FOR_DEV. Git evidence shows `HEAD` is `9524f9573b435e264def2752429f2825c1914407` on the unrelated REN-131/132 branch; `main...HEAD` contains broad unrelated changes. The REN-111 implementation files are unstaged modifications/untracked files, including `src/lib/auth/redirect.ts`, `src/lib/auth/redirect.test.ts`, middleware, auth pages/components, and `docs/.work-items/REN-111/`.

Comparison input unavailable: there is no REN-111 branch head or isolated base-to-head diff for the uncommitted implementation.

## Requirement Reconciliation

- REQ-001: PARTIAL. `src/middleware.ts` builds a `redirect_url` for protected `/profile` and `/become-a-seller` routes; `src/app/(home)/become-a-seller/page.tsx` uses the same helper. No isolated diff confirms all intended entry points.
- REQ-002: PARTIAL. `phone-first-sign-in.tsx` and `phone-first-sign-up.tsx` resolve `redirect_url` and use it for credentials, sign-up, and Google completion.
- REQ-003: PARTIAL. `getSafeRedirectUrl` rejects external, protocol-relative, backslash, control-character, and encoded-separator destinations.
- REQ-004: PARTIAL. Existing redirect query state is consumed by the custom auth components; no browser or isolated-diff evidence is available.
- REQ-005: PARTIAL. Static inspection found only redirect/auth and task-local governance changes in the unstaged REN-111 file set, but the overall branch contains unrelated changes.

## Scenario Reconciliation

- SCN-001 / SCN-002: PARTIAL. Middleware and Seller guards construct a destination-bearing sign-in URL.
- SCN-003: PARTIAL. Phone/email completion, unknown-phone sign-up, standalone sign-up, and Google `redirectUrlComplete` use the resolved destination.
- SCN-004: PARTIAL. The resolver and its static test cases cover malformed, external, protocol-relative, and encoded unsafe values.
- SCN-005 / SCN-006: PARTIAL. Sign-in/sign-up links retain the destination and auth pages add Suspense for query-state access; no isolated browser evidence exists for cart, refresh/back, or Clerk expiry behavior.

## Invariant Reconciliation

- INV-001: PARTIAL. Existing middleware protection remains and only the sign-in target changes.
- INV-002: PARTIAL. `getSafeRedirectUrl` returns an internal path or `/`.
- INV-003: PARTIAL. Completion paths use the resolved destination rather than a hard-coded `/`.
- INV-004: PARTIAL. The utility handles only the destination path; no credentials or session data are added to URLs by the reviewed changes.

## Flow and Architecture Review

FLOW-001 and FLOW-002 are statically aligned: route guards create `redirect_url`, auth components resolve it, phone/email flows navigate after session activation, and Google uses the existing Clerk callback with `redirectUrlComplete`. DEP-001, DEP-002, and INT-001 are partially evidenced by those same source paths. A completed architecture reconciliation requires the correct branch comparison.

## Security and Integration Review

SEC-001 is partially supported by `src/lib/auth/redirect.ts` and `src/lib/auth/redirect.test.ts`. The Google integration continues to use Clerk's existing callback and receives the prevalidated destination as completion target. Static inspection cannot establish runtime provider callback behavior or replay handling.

## Scope and Drift Review

No material drift was observed in the identifiable uncommitted REN-111 files. Scope cannot be passed because the active branch carries unrelated REN-104 through REN-141 changes and the work item is not on its expected branch.

## Test Expectation Review

- TEXP-001 / TEXP-004: PARTIAL. `src/lib/auth/redirect.test.ts` statically covers internal query preservation and unsafe/encoded path rejection.
- TEXP-002 / TEXP-003 / TEXP-006: PARTIAL. No component or regression test for auth completion, cart compatibility, refresh/back, or account-sync recovery is present in the identified REN-111 test file.
- TEXP-005: NOT_APPLICABLE for this review run because no auth-capable browser environment was supplied; it is OPTIONAL in the contract.

## Findings

### REV-001

- Severity: BLOCKER
- Category: scope
- Description: A trustworthy REN-111 implementation diff cannot be established from the current checkout.
- Evidence: Contract branch is `ayanganguly333/ren-111-inconsistent-guest-redirect-behavior-across-login-walls`; current branch is `ayanganguly333/ren-131-132-purchase-cart-analytics`; REN-111 changes are unstaged/untracked.
- Impact: The implementation cannot receive a completed contract reconciliation or a formal pass/fail result.
- Recommendation: Move or commit the REN-111 changes onto the expected branch, then rerun `$renivet-review REN-111`.

## Decisions Requiring Attention

None.

## Final Recommendation

The implementation is statically plausible and has no observed material drift, but the formal review is blocked by branch and comparison-base evidence. Required action: review from the expected REN-111 branch with an isolated commit/diff.
