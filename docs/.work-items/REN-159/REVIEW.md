# REVIEW: REN-159 — Cache category-only and category+sort catalog listing views

## Executive Result

`REVIEW_FAILED`; drift: `MATERIAL_DRIFT`; governance re-entry is required. The implementation introduces cache entries whose query ordering differs from the existing direct-query path and can be shared across storefront contexts with different ordering semantics.

## Review Scope and Git Evidence

Compared `origin/master` commit `14a9f6422ef619b71aebc2fc8be74db321112c7b` with implementation commit `97f31751367eb0d0cb1a555d90408014c548ed79` on branch `ayanganguly333/ren-159-cache-category-only-and-categorysort-catalog-listing-views`. The review also inspected the follow-up governance commit `1f6ac9f9097e5281335478967797c96721e4fd59`; it contains only review artifacts. Source evidence is limited to `src/components/shop/catalog-cache.ts`, `src/components/shop/catalog-cache.test.ts`, and `src/components/shop/storefront-catalog-page.tsx`.

## Requirement Reconciliation

- `REQ-159-001`: FAIL. Category-only cached calls omit the direct path's `prioritizeBestSellers` setting, so an identical request can have different product ordering when served from cache.
- `REQ-159-002`: FAIL. The key does not include `prioritizeNewProducts` or the storefront context. `/swap-passport?categoryId=<id>` and `/shop?categoryId=<id>&sortBy=createdAt&sortOrder=desc` share the same category/sort key although their direct queries have different priority behavior.
- `REQ-159-003`: PASS. The eligibility predicate excludes the approved unbounded and personalized inputs.
- `REQ-159-004`: FAIL. Existing ordering semantics are not preserved.
- `REQ-159-005`: PARTIAL. A cache-miss log exists, but repeat-hit, TTL refresh, and query-volume behavior are not covered by executable tests.
- `REQ-159-006`: FAIL. Displayed product ordering can differ solely because the response is cached.
- `REQ-159-007`: PASS. The added cache-miss log has bounded category/sort fields and no customer data.

## Scenario Reconciliation

- `SCN-159-001`: FAIL. The normal category-only cached query omits best-seller prioritization used by the uncached path.
- `SCN-159-002`: FAIL. Category-plus-createdAt can collide across `/shop` and `/swap-passport` despite distinct direct-query behavior.
- `SCN-159-003`: PARTIAL. A 60-second `revalidate` value is configured, but no test demonstrates refresh after expiry.
- `SCN-159-004`: PASS. The eligibility helper rejects search, price, extra filters, curated, personalized, and non-page-1 inputs.
- `SCN-159-005`: FAIL. A valid cache key can represent different ordering contracts depending on the storefront context.
- `SCN-159-006`: FAIL. Product ordering and filter-panel alignment can diverge from the existing direct path.

## Invariant Reconciliation

- `INV-159-001`: FAIL. The key does not uniquely identify all result-affecting ordering inputs.
- `INV-159-002`: PASS. Ineligible and user-specific requests are rejected by the cache eligibility helper.
- `INV-159-003`: FAIL. The cached callback omits result-affecting `prioritizeBestSellers` and `prioritizeNewProducts` arguments.
- `INV-159-004`: PARTIAL. The 60-second TTL is configured, but expiration behavior has no direct test evidence.
- `INV-159-005`: PASS. The diagnostic is bounded and non-sensitive.

## Flow and Architecture Review

`FLOW-159-001` fails because `getCachedCategoryProducts` accepts only category and sort, but the direct query also depends on storefront ordering priorities. The normal direct fallback at `storefront-catalog-page.tsx` passes `prioritizeBestSellers` for default recommended shop listings and `prioritizeNewProducts` for the Swap Passport storefront. The cached callback at the same file does not pass either value. `FLOW-159-002` is otherwise preserved for rejected cache shapes. `DEP-159-001` is not fully respected because parameter normalization alone is insufficient to express the ordering context.

## Security and Integration Review

`SEC-159-001` PASS. This is a public catalog cache with no user identity in the eligibility descriptor or key. There are no authentication, authorization, secret, mutation, or external-provider changes. The Next.js cache integration is safe only after the result-affecting ordering inputs are restored to its descriptor/key/query.

## Scope and Drift Review

The files remain within the intended catalog-caching scope, but `REQ-159-001`, `REQ-159-002`, `REQ-159-004`, and `INV-159-001`–`INV-159-003` are contradicted. This is `MATERIAL_DRIFT`, because cache-key identity and displayed result ordering are approved behavioral invariants.

## Test Expectation Review

- `TEXP-159-001`: PARTIAL. Tests cover basic category/sort key separation but omit storefront ordering priorities and cross-context collision cases.
- `TEXP-159-002`: FAIL. No test verifies first miss/second hit/TTL refresh against the actual cache wrapper, and no test compares cached arguments to the direct query.
- `TEXP-159-003`: PASS. Focused tests cover many out-of-scope bypass inputs.
- `TEXP-159-004`: PARTIAL. The miss diagnostic is inspectable, but live hit/miss/query-volume evidence remains unavailable.

## Findings

### REV-159-002

- Severity: BLOCKER
- Category: invariant
- Description: Cached category listings omit the direct path's `prioritizeBestSellers` and `prioritizeNewProducts` inputs, and the key does not distinguish these ordering contexts.
- Evidence: `REQ-159-001`, `REQ-159-002`, `REQ-159-004`, `SCN-159-001`, `SCN-159-002`, `INV-159-001`, `INV-159-003`; `getCachedCategoryProducts` at `src/components/shop/storefront-catalog-page.tsx:528` accepts only category/sort, while the direct path at `:844`–`:848` supplies priority flags. `src/app/(marketing)/swap-passport/page.tsx` sets `defaultSortBy="createdAt"` and `prioritizeNewProducts`, producing a key collision with an ordinary createdAt category sort.
- Impact: Shoppers can receive a cached product order that differs from the live result, including across different storefront routes.
- Recommendation: Re-enter specification, then make the cache descriptor/key/query include every result-affecting ordering priority or explicitly exclude contexts with priority behavior; add regression tests covering normal category default ordering and the `/shop` versus `/swap-passport` createdAt collision.

### REV-159-003

- Severity: HIGH
- Category: test
- Description: Tests do not exercise actual cache miss/hit/TTL behavior or compare the cached query contract with the direct query contract.
- Evidence: `TEXP-159-002`; `src/components/shop/catalog-cache.test.ts` tests only the pure eligibility/key helper.
- Impact: The required repeat-request and expiry behavior is unproven and the ordering regression was not detected.
- Recommendation: Add an injectable cache/query seam or an integration test that proves first miss, repeated hit, expiry refresh, and exact direct/cached query-argument parity.

## Decisions Requiring Attention

None. The fixes are constrained by the already approved requirement to preserve ordering and key identity.

## Final Recommendation

Do not merge this implementation. Re-enter REN-159 specification governance, correct `REV-159-002` and `REV-159-003`, then rerun tests and the read-only review. No production or Linear state should be changed from this review.
