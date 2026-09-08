# REVIEW: REN-162 — Extend product-click tracking to search results and homepage surfaces

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS` with `NO_DRIFT`. The implementation preserves the existing search-grid behavior, centralizes its browser transport, and adds tracking to active homepage product-detail links. No governance re-entry is required. The comparison is `origin/master` commit `1cf68d74779ac2c269a52d1f2388a0e0f97863e5` to implementation commit `2be82a401fb4f7f1d32c20224b64bd5daa092906`.

## Review Scope and Git Evidence

- Base branch: `origin/master`; merge base: `1cf68d74779ac2c269a52d1f2388a0e0f97863e5`.
- Head commit: `2be82a401fb4f7f1d32c20224b64bd5daa092906`.
- Changed application files: `src/lib/analytics/product-click.ts`, its focused test, the shop consumer, and active homepage product-card components.
- The task-local SPEC and CRITIQUE are included; this REVIEW is the only post-implementation governance result.
- The current repository already tracked search-grid clicks; the implementation retains that behavior through the shared helper and adds homepage coverage.

## Requirement Reconciliation

- `REQ-162-001`: PASS — homepage product-detail links call `sendProductClickEvent` with product and brand identifiers.
- `REQ-162-002`: PASS — active root-homepage product surfaces in new arrivals, products-under-999, and swap-space are wired; may-also-love reuses the new-arrivals `ProductCard`.
- `REQ-162-003`: PASS — `shop-products.tsx` now delegates to the same beacon/keepalive helper without changing the endpoint or payload.
- `REQ-162-004`: PASS — helper catches synchronous errors and keepalive rejection without blocking link navigation or card controls.
- `REQ-162-005`: PASS — tracking is attached to individual product-detail links; quick-add/wishlist/share controls retain their existing propagation boundaries.

## Scenario Reconciliation

- `SCN-162-001`: PASS by changed-link evidence in the three active homepage surfaces and shared product-card reuse.
- `SCN-162-002`: PASS — shop/search tracking is preserved through the extracted helper.
- `SCN-162-003`: PASS — failure-isolation behavior is covered by `product-click.test.ts`.
- `SCN-162-004`: PASS — only product-detail links receive the helper; control handlers remain unchanged.
- `SCN-162-005`: PARTIAL — static link inspection supports one dispatch per activated link, but live browser event-count verification remains outstanding.

## Invariant Reconciliation

- `INV-162-001`: PASS — the helper serializes only productId and brandId.
- `INV-162-002`: PASS — transport errors are caught and navigation is not controlled by the helper.
- `INV-162-003`: PASS by link-level wiring and preserved control stop-propagation; live duplicate-count verification is still recommended.
- `INV-162-004`: PASS — the existing server endpoint remains responsible for auth and persistence.

## Flow and Architecture Review

- `FLOW-162-001`: PASS — product-link `onClick` dispatches tracking and leaves `AnimatedProductLink` navigation unchanged.
- `FLOW-162-002`: PASS — beacon and keepalive failures are best-effort and isolated in `src/lib/analytics/product-click.ts`.
- The shared helper is a compatible refactor of the existing shop implementation; no public API, database, or recommendation architecture changed.

## Security and Integration Review

- `SEC-162-001`: PASS — client payload contains no customer identity, and `src/app/api/products/track-click/route.ts` still resolves identity through server-side `auth()`.
- `INT-162-001`: PASS — the existing endpoint, `{ productId, brandId }` payload, event type, and persistence path are unchanged.
- No new retry loop or duplicate server write policy was introduced; transport remains best-effort as approved.

## Scope and Drift Review

`NO_DRIFT`. The diff stays within the approved homepage wiring and shared transport design. Recommendation weighting, endpoint behavior, persistence schema, and non-product controls were not changed.

## Test Expectation Review

- `TEXP-162-001`: PARTIAL — helper behavior is tested, while homepage link rendering is verified statically through the changed call sites rather than a browser component test.
- `TEXP-162-002`: PARTIAL — endpoint and server boundary were inspected, but no live database event was asserted in this review.
- `TEXP-162-003`: PASS — focused transport tests cover fallback and failure isolation; full Bun suite retains unrelated baseline failures.
- `TEXP-162-004`: PASS — client sends no identity and the existing server auth boundary is unchanged.

Separate verification evidence: focused REN-162 tests passed (2/2), formatting passed, and the full Bun suite reported 262 passing, 1 skipped, and 2 unrelated failures. TypeScript still reports pre-existing diagnostics in the legacy homepage files; no new diagnostic was reported for the modified click-handler lines.

## Findings

### REV-162-001

- Severity: LOW
- Category: test
- Description: Live browser/database verification of homepage click rows and duplicate-event behavior remains outstanding.
- Evidence: `SCN-162-001`, `SCN-162-005`, `TEXP-162-001`, `TEXP-162-002`; implementation call sites in `new-arrivals.tsx`, `products-under-999.tsx`, and `swap-space.tsx` are statically present, but this review does not execute application tests or browser QA.
- Impact: A runtime integration or event-propagation issue could remain undetected until manual QA.
- Recommendation: Manually click one product card in each active homepage section and confirm one `productEvents` click row per activation, including anonymous and authenticated sessions where available.

## Decisions Requiring Attention

None.

## Final Recommendation

Approve the implementation for merge with the low-severity manual verification follow-up. No governance re-entry is required.

