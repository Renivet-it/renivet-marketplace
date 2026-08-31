# REN-111 Independent Critic Review

Reviewer: Hubble (fresh context, read-only)

Overall result: BLOCKED. The Class C Seller-flow decision remains unresolved, and the redirect contract requires further design before approval.

## Architect reconciliation

The user confirmed the Seller flow remains login-gated, shared redirect preservation applies to all existing internal callers, unsafe values fall back to `/`, and Google SSO restores the validated destination through its existing callback. The approved contract now resolves CRIT-001 through CRIT-006 as follows: standalone sign-up and sign-in/sign-up switching are covered by SCN-003/SCN-006; SEC-001 defines raw and encoded unsafe-path rejection; Clerk's completion target is the validated internal destination; recovery and compatibility are covered by SCN-005/SCN-006 and TEXP-003/TEXP-006; and focused unit/component/security coverage is required.

- DESIGN_BLOCKER — Requirements/scenarios: standalone sign-up and sign-in-to-sign-up switching were not initially covered. Evidence: `src/components/auth/phone-first-sign-up.tsx:56-149`, `src/components/auth/phone-first-sign-in.tsx:553-560`. Reconciliation: expanded SCN-003 and added SCN-006/TEXP-006.
- DESIGN_BLOCKER — Security: same-origin validation needed exact parser/allowlist and encoded-input rules. Evidence: `src/app/(auth)/auth/signin/page.tsx:10-19`, `src/components/auth/phone-first-sign-in.tsx:65-81`. Reconciliation: SEC-001 now states the minimum validation contract; implementation must test it.
- DESIGN_BLOCKER — Integration: Google uses Clerk `redirectUrlComplete: "/"`, while the callback does not define destination restoration. Evidence: `src/components/auth/phone-first-sign-in.tsx:143-157`, `src/app/(auth)/auth/sso-callback/page.tsx:14-39`.
- MAJOR — Recovery: auth errors, refresh/back, expired Clerk state, `setActive` failure, and account-sync failure lacked explicit policy. Evidence: `src/components/auth/phone-first-sign-in.tsx:102-132,208-332`. Added to SCN-006/TEXP-006.
- MAJOR — Compatibility: existing corporate/profile destination-bearing callers need explicit scope and tests. Evidence: `src/app/(protected)/profile/corporate/page.tsx:7-11`, `src/app/(protected)/profile/corporate/request-quote/page.tsx:8-15`.
- MINOR — Testability: encoded construction, Google restoration, retry, and sync failure need assertions. Added to the required expectations.

The referenced `tests/JOURNEYS.md` remains absent from the checkout. The Linear issue description is the available source for journey intent.
