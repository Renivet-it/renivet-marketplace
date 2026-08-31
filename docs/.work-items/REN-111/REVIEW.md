# REVIEW: REN-111 â€” Inconsistent guest-redirect behavior across login walls

## Executive Result

REVIEW_PASSED_WITH_FINDINGS. Drift is `NO_DRIFT`; governance re-entry is not required. Compared `main` commit `4bcab8ca270baf9e8534b0d88e4926f626ea344c` with implementation commit `a73eee3f7aa1c64a2180f51efae972f7ee7c6cce`. The review includes the uncommitted `tests/ren-111-guest-redirect-flow.test.ts` coverage artifact.

## Review Scope and Git Evidence

The branch `ayanganguly333/ren-111-inconsistent-guest-redirect-behavior-across-login-walls` is rebased onto `origin/main`. The comparison adds the REN-111 work-item artifacts, redirect utility/tests, middleware and Seller guards, custom auth components, and Suspense wrappers for auth pages. The only uncommitted path is the focused REN-111 regression test. `git diff --check origin/main...HEAD` is clean.

## Requirement Reconciliation

- REQ-001: PASS. `src/middleware.ts` and `src/app/(home)/become-a-seller/page.tsx` construct destination-bearing sign-in URLs.
- REQ-002: PASS. The custom sign-in and sign-up components validate `redirect_url` and use the resulting destination for phone, email, sign-up, and Google completion paths.
- REQ-003: PASS. `src/lib/auth/redirect.ts` restricts results to internal paths or `/`.
- REQ-004: PASS. Existing auth guards remain and cart `/mycart` redirect behavior is unchanged.
- REQ-005: PASS. The diff is limited to redirect/auth navigation, focused tests, and task artifacts.

## Scenario Reconciliation

- SCN-001 / SCN-002: PASS. Middleware and Seller guards preserve the protected internal destination.
- SCN-003: PASS. Phone, email, unknown-phone sign-up, standalone sign-up, and Google completions use the resolved destination.
- SCN-004: PASS. Missing, malformed, external, protocol-relative, backslash, control-character, and encoded-separator values fall back to `/`.
- SCN-005: PASS. The guest cart caller keeps `/auth/signin?redirect_url=/mycart`; authenticated guard behavior is unchanged.
- SCN-006: PASS. Auth-page switching encodes the validated destination into the reciprocal link, and client-side `useSearchParams` re-resolves it on render. Account-sync errors remain non-blocking before navigation.

## Invariant Reconciliation

- INV-001: PASS. Protected route guards remain in place.
- INV-002: PASS. `getSafeRedirectUrl` returns an internal path or `/`.
- INV-003: PASS. Completion paths use the valid destination rather than an unrelated default.
- INV-004: PASS. No credentials, tokens, or user data are introduced into redirect URLs.

## Flow and Architecture Review

FLOW-001 and FLOW-002 are implemented through `src/lib/auth/redirect.ts`, `src/middleware.ts`, the Seller page, and custom sign-in/sign-up components. DEP-001/DEP-002 and INT-001 retain the existing Clerk callback and session semantics; Google receives only the validated completion target.

## Security and Integration Review

SEC-001 passes. The shared resolver rejects raw and decoded external/protocol-relative separators, backslashes, and control characters. `src/lib/auth/redirect.test.ts` directly tests safe paths and unsafe inputs. Clerk provider configuration is unchanged.

## Scope and Drift Review

NO_DRIFT. Each changed application file supports the approved redirect/auth scope; no schema, payment, order, inventory, dependency, or production-configuration changes were found.

## Test Expectation Review

- TEXP-001: PASS. `src/lib/auth/redirect.test.ts` covers destination preservation and fallback.
- TEXP-002: PARTIAL. `tests/ren-111-guest-redirect-flow.test.ts` verifies the real custom-component source contracts for completion and Google paths, but no DOM/Clerk component-test runtime exists in this checkout.
- TEXP-003: PASS. The focused regression test asserts the existing `/mycart` guest redirect and destination-bearing middleware/Seller guards.
- TEXP-004: PASS. Utility coverage exercises unsafe raw and encoded redirect inputs.
- TEXP-005: NOT_APPLICABLE. It is optional and no auth-capable browser environment is supplied.
- TEXP-006: PARTIAL. The focused regression test asserts sign-in/sign-up switching, search-param re-resolution, and non-blocking account-sync behavior; it does not execute an expired Clerk session in a browser runtime.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: Focused coverage is source-contract based; no executable DOM/Clerk component-test runtime is installed in this checkout.
- Evidence: TEXP-002 and TEXP-006; `tests/ren-111-guest-redirect-flow.test.ts`; `package.json` has Bun tests but no DOM/component-test dependency.
- Impact: Clerk UI interaction and expired-session behavior remain unverified in an interactive test environment.
- Recommendation: Add an auth-capable component or browser test environment when available; no governance re-entry is required for this scoped redirect fix.

## Decisions Requiring Attention

None.

## Final Recommendation

The implementation is within the approved contract and has focused regression coverage. Keep the PR draft until its normal reviewer accepts the documented component-runtime coverage limitation.
