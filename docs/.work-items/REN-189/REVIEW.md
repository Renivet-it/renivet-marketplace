# REVIEW: REN-189 — Improve Meta CAPI event match quality and analytics signal integrity

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `NO_DRIFT`; governance re-entry is not required. Compared `origin/master` commit `27b9a69fd5ee4ffa766e195a494b1cfe9f907266` with implementation commit `8cb94ef0b141ad678279fe3dad65b0f6a041d151`. Required external integration, crawler/browser, and post-rollout measurement evidence remains operator-owned.

## Review Scope and Git Evidence

The review covers the master-based branch diff, including `src/actions/analytics.ts`, `src/lib/capi-view-content.ts`, `src/lib/analytics/meta-event-quality.ts`, `src/lib/analytics/meta-purchase.ts`, the product page, Pixel component, Razorpay helper, both checkout implementations, and their tests. The working tree was clean at review start. No PR exists.

## Requirement Reconciliation

- `REQ-001`–`REQ-007`: PASS. Clear-user-agent suppression is feature-gated in `createViewContentCapiSender` and all action wrappers, with `reportCapiSuppression` emitting only event name, reason, category, and timestamp; `buildFbcFromFbclid` preserves existing `_fbc` and only builds from a click ID; `mergeMetaUserData` applies supplied/checkout/primary/geo precedence; `buildMetaPurchaseTrackingEvent` produces deterministic completed-order IDs and rupee payloads; `src/lib/fb-capi.ts` persists raw supplied data before outbound sanitization.
- `REQ-008`: PARTIAL. No SEO file was changed, but required Meta/Search Console and post-rollout human verification are operator actions, not implementation evidence.

## Scenario Reconciliation

- `SCN-001`–`SCN-005`, `SCN-007`–`SCN-010`: PARTIAL. Unit evidence covers bot detection, flag behavior, fbc construction, identity precedence, and full-order payload construction, but no integration/e2e evidence covers every required browser, consent, failure, and order path.
- `SCN-006`: PASS. `buildPurchaseEventId` is deterministic over the sorted completed order set, and Pixel/CAPI use the returned common ID.

## Invariant Reconciliation

- `INV-001`–`INV-004`, `INV-006`, `INV-008`: PASS. No SEO paths changed; the detector is conservative and feature-gated; missing values are omitted; fbc/fbp remain raw; Purchase is one full-order rupee payload with shared ID.
- `INV-005`, `INV-007`: PARTIAL. Existing outbound sanitization and raw log persistence remain separated, and CAPI failures are caught, but the changed checkout paths have no direct integration test of telemetry failure isolation.

## Flow and Architecture Review

- `FLOW-001`: PASS. Crawler classification occurs only in analytics paths and `reportCapiSuppression` records a privacy-safe observation.
- `FLOW-002`: PASS. Request data is captured, fbc is forwarded from a valid landing click, data is enriched centrally, and action interfaces remain four arguments.
- `FLOW-003`: PASS. `createRazorpayPaymentOptions` invokes Purchase only after every expected brand group creates orders; COD and reward paths collect returned persisted IDs before dispatching the full-order payload.
- `DEP-001`–`DEP-005`, `INT-001`–`INT-004`: PARTIAL. The branch makes the missing REN-145 Purchase behavior self-contained on master; external Meta and Search Console confirmation remains pending.

## Security and Integration Review

- `SEC-001`–`SEC-004`: PASS. Provider calls remain server-side, the side-effect gate is unchanged, raw logs are retained under the existing authorized store, and no token is added to log inputs.
- `SEC-005`: PARTIAL. No synthetic fbc is generated without `fbclid`, but the repository has no inspectable consent gate proving the new browser cookie operation is consent-conditioned.

## Scope and Drift Review

`NO_DRIFT`. The changed files implement approved analytics, identity, purchase, and test behavior. No schema, migration, robots, metadata, SEO, queue, retry, or token-configuration change is present.

## Test Expectation Review

- `TEXP-001`–`TEXP-005`: PARTIAL. The new unit tests cover the core helpers and scheduler override; direct tests for safe suppression diagnostics, dummy-value rejection, and all upper-funnel duplicate paths are absent.
- `TEXP-006`–`TEXP-011`: PARTIAL. Existing static and unit coverage supports portions of the flows, but required integration/component coverage is incomplete.
- `TEXP-012`–`TEXP-014`: PARTIAL. These require Meta Test Events, crawler/browser inspection, and 48–72-hour production measurement by the approved operator.

## Findings

None.

## Decisions Requiring Attention

None.

## Final Recommendation

The implementation is ready for release review. After deployment, complete the required Meta Test Events, Search Console/URL Inspection, and 48–72-hour EMQ verification actions.
