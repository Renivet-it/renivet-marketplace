# REVIEW: REN-111 — Inconsistent guest-redirect behavior across login walls

## Executive Result

REVIEW_FAILED. Drift is `NO_DRIFT`; governance re-entry is not required. Compared `main` commit `e7719c593157748314ed6ccaa63b412df7f39468` with implementation commit `54f798e38272e2cb0474c3b8db92ffbe40b46cfa`. The redirect implementation follows the approved behavior, but required component and regression coverage is absent.

## Review Scope and Git Evidence

The branch `ayanganguly333/ren-111-inconsistent-guest-redirect-behavior-across-login-walls` is one commit ahead of `main`. The comparison contains the REN-111 task artifacts, a redirect utility/test, middleware, Seller page, auth pages, and custom sign-in/sign-up components. `git diff --check main...HEAD` reported no whitespace errors. The worktree was clean when the implementation commit was reviewed.

## Requirement Reconciliation

- REQ-001: PASS. `src/middleware.ts` constructs destination-bearing sign-in URLs for protected customer routes, and `src/app/(home)/become-a-seller/page.tsx` uses the shared helper.
- REQ-002: PASS. `phone-first-sign-in.tsx` and `phone-first-sign-up.tsx` resolve `redirect_url` and use it in credential, sign-up, and Google completion paths.
- REQ-003: PASS. `src/lib/auth/redirect.ts` restricts outcomes to internal paths or `/`.
- REQ-004: PASS. Existing auth protection remains while the sign-in/sign-up links retain destination query state.
- REQ-005: PASS. The comparison is limited to redirect/auth code, focused utility coverage, and REN-111 governance artifacts.

## Scenario Reconciliation

- SCN-001 / SCN-002: PASS. Middleware and Seller guards build internal `redirect_url` values.
- SCN-003: PASS. Phone, email, unknown-phone sign-up, standalone sign-up, and Google completion use the resolved destination.
- SCN-004: PASS. The resolver defaults malformed, external, protocol-relative, backslash, control-character, and encoded-separator values to `/`.
- SCN-005 / SCN-006: PARTIAL. The code preserves destination state across sign-in/sign-up navigation and supplies a safe fallback, but required regression evidence is absent.

## Invariant Reconciliation

- INV-001: PASS. The existing unauthenticated route guards remain in place.
- INV-002: PASS. `getSafeRedirectUrl` returns an internal URL or `/`.
- INV-003: PASS. Auth completions no longer discard valid destination state.
- INV-004: PASS. No credential, token, or user data is added to redirect URLs.

## Flow and Architecture Review

FLOW-001 and FLOW-002 are implemented through `src/lib/auth/redirect.ts`, `src/middleware.ts`, the Seller page, and the custom auth components. DEP-001/DEP-002 and INT-001 are consistent with the existing Clerk integration: Google retains `/auth/sso-callback` and uses the validated destination as `redirectUrlComplete`.

## Security and Integration Review

SEC-001 passes on static evidence. The resolver rejects raw and decoded external/protocol-relative separators, backslashes, and control characters. `redirect.test.ts` directly exercises internal query preservation and representative unsafe values. Google provider configuration is unchanged.

## Scope and Drift Review

NO_DRIFT. All changed implementation files serve the approved redirect/auth scope. No schema, payment, order, inventory, dependency, or production configuration changes were observed.

## Test Expectation Review

- TEXP-001: PASS. `src/lib/auth/redirect.test.ts` covers destination preservation and safe fallback.
- TEXP-002: FAIL. No component test covers completion branches in `phone-first-sign-in.tsx` or `phone-first-sign-up.tsx`.
- TEXP-003: FAIL. No regression test covers existing cart return behavior or authenticated direct access.
- TEXP-004: PASS. The utility test covers unsafe raw and encoded redirect inputs.
- TEXP-005: NOT_APPLICABLE. It is optional and no auth-capable browser environment was supplied for this review.
- TEXP-006: FAIL. No test covers sign-in/sign-up switching, refresh/back, expired auth state, or account-sync failure recovery.

## Findings

### REV-001

- Severity: HIGH
- Category: test
- Description: Required component and regression test expectations are not implemented.
- Evidence: TEXP-002, TEXP-003, and TEXP-006 require coverage; `src/lib/auth/redirect.test.ts` is the only REN-111 test and covers only the resolver.
- Impact: Authentication completion and compatibility regressions can reach production without focused automated detection.
- Recommendation: Add the required auth-flow and compatibility regression tests, then rerun REVIEW.

## Decisions Requiring Attention

None.

## Final Recommendation

The redirect behavior is implemented within scope, but do not treat the review as passed until REV-001 is resolved. No governance re-entry is required; add the specified tests and rerun the review.
