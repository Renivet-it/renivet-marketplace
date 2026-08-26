# REVIEW: REN-115 — Fix 4 hardcoded Delhivery production-URL bypass sites

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; material drift: `NO_DRIFT`; governance re-entry: `false`. The implementation uses a shared URL resolver at all four approved active call sites and preserves the production fallback. One non-blocking test-coverage finding remains.

## Review Scope and Git Evidence

- Linear issue: REN-115; approved contract: `docs/.work-items/REN-115/work-item.yaml`.
- Base branch: `main`.
- Base commit: `26914e7c0f5b04b60b4e457b45f0100a9367f7e7`.
- Head commit: `5477f21587e4d90385765b384fdc901a3de1f2fa`.
- PR: none.
- The implementation was reviewed before commit and is now recorded at the pushed head commit; the review included the previously unstaged resolver/test files.
- Changed implementation files: `src/actions/order-tracking.ts`, `src/lib/trpc/routes/general/orders.ts`, `src/lib/trpc/routes/general/returnReplace.ts`, `src/lib/delhivery/url.ts`, and `src/lib/delhivery/url.test.ts`.

## Requirement Reconciliation

- `REQ-001`: PASS — the four active request expressions call `resolveDelhiveryUrl`; no direct production URL remains at those sites.
- `REQ-002`: PASS — `src/lib/delhivery/url.ts` trims, removes trailing slashes, validates absolute HTTP(S), rejects malformed non-empty values, and keeps the fallback in one resolver.
- `REQ-003`: PASS — existing methods, endpoint suffixes, headers, payloads, parsing, caller results, and state writes are unchanged in the touched hunks.
- `REQ-004`: PASS — only the four call sites, the shared helper, focused unit tests, and governance artifacts changed; kill switch/refund/schema/retry behavior is untouched.
- `REQ-005`: PASS — the diff adds no sensitive logging or browser exposure.

## Scenario Reconciliation

- `SCN-001`: PASS by static inspection — all four sites pass the configured base to the resolver.
- `SCN-002`: PASS by static inspection and unit test — blank input uses the production fallback.
- `SCN-003`: PARTIAL — request construction is preserved, but the required four-path regression/request-spy suite is not present in the diff.
- `SCN-004`: PASS — diff and source scope are limited as specified.

## Invariant Reconciliation

- `INV-001`: PASS — no named request expression embeds the production URL.
- `INV-002`: PASS — resolver normalization and fallback preserve endpoint suffix construction.
- `INV-003`: PASS — changed paths are limited to the approved files.
- `INV-004`: PASS — token handling remains server-side and no new sensitive values are logged.

## Flow and Architecture Review

`FLOW-001` is satisfied by the shared `resolveDelhiveryUrl` helper. `INT-001` remains the same Delhivery integration; no provider method, authentication scheme, payload, response contract, retry behavior, or state transition was changed. No dependency or schema change was introduced.

## Security and Integration Review

`SEC-001` through `SEC-003` are satisfied statically: the destination is resolved server-side, the token remains in existing Authorization headers, and no new client exposure or secret logging was added. The configured host is validated as absolute HTTP(S) before request construction. No live provider calls are part of the implementation tests.

## Scope and Drift Review

`NO_DRIFT`. The implementation follows the approved URL-only scope and does not implement the excluded kill switch, refund, schema, retry, or unrelated Delhivery work.

## Test Expectation Review

- `TEXP-001`: PASS — `src/lib/delhivery/url.test.ts` covers whitespace, trailing slashes, blank fallback, and malformed values.
- `TEXP-002`: PARTIAL — no four-call-site request-spy integration test was added.
- `TEXP-003`: PARTIAL — no parameterized production regression suite was added.
- `TEXP-004`: PASS by source inspection — direct active URLs are removed from the four named sites and no new sensitive logging was introduced.
- `TEXP-005`: PASS by diff inspection — excluded behavior is unchanged.

## Findings

### REV-001

- Severity: MEDIUM
- Category: test
- Description: The approved contract requires request-spy and production regression coverage for all four call sites, but the implementation currently adds only resolver unit tests.
- Evidence: `TEXP-002`, `TEXP-003`, `SCN-003`; `src/lib/delhivery/url.test.ts` contains resolver tests only.
- Impact: URL wiring and production request parity are not independently protected against future regressions.
- Recommendation: Add focused request-spy tests covering all four call sites, including configured URL and production fallback cases, before merging if practical.

## Decisions Requiring Attention

None. The developer’s URL-only scope confirmation is recorded in `DEC-001`.

## Final Recommendation

Accept as `REVIEW_PASSED_WITH_FINDINGS` with no governance re-entry. Address `REV-001` before merge if the required regression coverage can be added without expanding scope.
