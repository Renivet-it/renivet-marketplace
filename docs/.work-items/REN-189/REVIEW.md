# REVIEW: REN-189 — Improve Meta CAPI event match quality and analytics signal integrity

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `NO_DRIFT`; governance re-entry is not required. Compared `origin/master` commit `27b9a69fd5ee4ffa766e195a494b1cfe9f907266` with implementation commit `8c5f66c776aa183b5baa78e20f484416382ea6d9`. Required external integration, crawler/browser, and post-rollout measurement evidence remains operator-owned.

## Review Scope and Git Evidence

The review covers the clean master-based branch diff, including `src/actions/analytics.ts`, `src/lib/capi-view-content.ts`, `src/lib/analytics/meta-event-quality.ts`, `src/lib/analytics/meta-purchase.ts`, `src/lib/fb-capi.ts`, the product page, Pixel component, Razorpay helper, both checkout implementations, and their tests. No PR exists.

## Requirement Reconciliation

- `REQ-001`–`REQ-007`: PASS. Clear-user-agent suppression is feature-gated in `createViewContentCapiSender` and all action wrappers, with `reportCapiSuppression` emitting only event name, reason, category, and timestamp. `buildFbcFromFbclid`, `isValidFbc`, and `isValidFbp` preserve only valid raw browser identifiers without fabricating clicks. `buildMetaProfileUserData` and `mergeMetaUserData` centralize available Clerk profile, selected checkout, primary-address, and trusted request-geography data. `prepareCapiUserDataForMeta` omits malformed browser identifiers and hashes `external_id` only at the outbound boundary while `createCapiEventSender` persists the approved raw input. `buildMetaPurchaseTrackingEvent` supplies one deterministic `event_id`/`order_id`, all product IDs, item count, and the full-order rupee value.
- `REQ-008`: PARTIAL. No SEO file was changed, but required Meta/Search Console and post-rollout human verification are operator actions, not implementation evidence.

## Scenario Reconciliation

- `SCN-001`–`SCN-005`, `SCN-007`–`SCN-010`: PARTIAL. Static test evidence covers conservative bot detection, flag behavior, browser-ID validation, complete profile enrichment, checkout-address precedence, raw-log/outbound-hash separation, and full-order payload construction, but external/e2e evidence does not yet cover every deployed browser, consent, crawler, and order path.
- `SCN-006`: PASS. `buildPurchaseEventId` is deterministic over the sorted completed order set, and Pixel/CAPI use the returned common ID.

## Invariant Reconciliation

- `INV-001`–`INV-008`: PASS. No SEO path is changed; uncertain agents fail open; unavailable data and malformed browser IDs are omitted; valid fbc/fbp remain raw; personal-field SDK hashing and explicit outbound `external_id` hashing are separated from approved raw Renivet logging; Pixel/CAPI IDs match; telemetry failures are contained; and Purchase remains one complete full-order rupee event.

## Flow and Architecture Review

- `FLOW-001`: PASS. Crawler classification occurs only in analytics paths and `reportCapiSuppression` records a privacy-safe observation.
- `FLOW-002`: PASS. Request data is captured, only valid fbc/fbp values are forwarded raw, authenticated profile data is loaded independently of individual callers, selected checkout values take precedence, `external_id` is hashed only outbound, and action interfaces remain four arguments.
- `FLOW-003`: PASS. `createRazorpayPaymentOptions` invokes Purchase only after every expected brand group creates orders; COD and reward paths collect returned persisted IDs before dispatching the full-order payload with matching `event_id` and `order_id`.
- `DEP-001`–`DEP-005`, `INT-001`–`INT-004`: PARTIAL. The branch makes the missing REN-145 Purchase behavior self-contained on master; external Meta and Search Console confirmation remains pending.

## Security and Integration Review

- `SEC-001`–`SEC-004`: PASS. Provider calls and hashing remain server-side, the side-effect gate is unchanged, raw logs are retained under the existing authorized store, the outbound payload does not leak raw `external_id`, and no token is added to log inputs.
- `SEC-005`: PARTIAL. No synthetic fbc is generated without `fbclid`, but the repository has no inspectable consent gate proving the new browser cookie operation is consent-conditioned.

## Scope and Drift Review

`NO_DRIFT`. The changed files implement approved analytics, identity, purchase, and test behavior. No schema, migration, robots, metadata, SEO, queue, retry, or token-configuration change is present.

## Test Expectation Review

- `TEXP-001`–`TEXP-005`: PARTIAL. Static tests directly cover crawler/ordinary-browser classification, privacy-safe suppression diagnostics, browser-ID validation, profile/address precedence, outbound hashing, raw logging, deterministic Purchase IDs, and scheduler forwarding; deployed page-lifecycle evidence remains pending.
- `TEXP-006`–`TEXP-011`: PARTIAL. Existing static and unit coverage supports portions of the flows, but required integration/component coverage is incomplete.
- `TEXP-012`–`TEXP-014`: PARTIAL. These require Meta Test Events, crawler/browser inspection, and 48–72-hour production measurement by the approved operator.

## Findings

None.

## Decisions Requiring Attention

None.

## Final Recommendation

The implementation is ready for release review. After deployment, complete the required Meta Test Events, Search Console/URL Inspection, and 48–72-hour EMQ verification actions.
