# REVIEW: REN-133 — Consolidate duplicate purchase_completed instrumentation

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS` with `NO_DRIFT`. The comparison base and current `HEAD` are both `7eb28fd56eb75769e8088938693c3e0831882297`; the reviewed implementation is an uncommitted working-tree diff on `ayanganguly333/ren-133-consolidate-purchase-completed-instrumentation`. Governance re-entry is not required.

## Review Scope and Git Evidence

The implementation diff changes `src/lib/analytics/meta-purchase.ts`, its focused test, and the two approved checkout callers. Untracked additions are limited to `docs/.work-items/REN-133/` and the REN-133 implementation plan. No schema, migration, dependency, production configuration, order mutation, payment, cart, notification, or event-taxonomy file changed.

The shared `trackMetaPurchase` function now owns empty-order handling, payload/event-ID construction, Pixel dispatch, CAPI dispatch, and independent transport failure isolation. `CheckoutContent` and `OrderPage` retain their local state adapters and all five existing completion trigger locations while removing direct Purchase transport invocation.

## Requirement Reconciliation

- `REQ-133-001`: PASS — both checkout components import and invoke `trackMetaPurchase`; direct Purchase Pixel/CAPI construction is removed while server PostHog ownership is unchanged.
- `REQ-133-002`: PASS — the diff preserves `availableItems` versus `allAvailableItems`, totals, quantities, user/address fields, URL construction, Razorpay callback registration, and COD/reward invocation locations.
- `REQ-133-003`: PASS — `trackMetaPurchase` catches synchronous Pixel failure, still attempts CAPI, and catches synchronous/asynchronous CAPI failure without returning a rejecting promise.
- `REQ-133-004`: PASS — `src/lib/trpc/routes/general/orders.ts` still calls `capturePurchaseCompleted`; the implementation adds no retry or deduplication state.
- `REQ-133-005`: PASS — no matching field was added and error reporting passes only the existing error object/message, not the purchase or customer payload.

## Scenario Reconciliation

- `SCN-133-001`: PASS — the shared helper constructs one event ID/payload and supplies both to Pixel and CAPI; both checkout flows delegate to it.
- `SCN-133-002`: PASS — all pre-existing Razorpay callback, COD, and reward call sites remain present and now reference the local adapter; server capture remains unchanged.
- `SCN-133-003`: PASS — focused tests cover empty IDs, Pixel exceptions, and asynchronous CAPI rejection while the function remains non-throwing.
- `SCN-133-004`: PASS — the diff adds no retry, persisted state, sensitive field, or server-side PostHog change.

## Invariant Reconciliation

- `INV-133-001`: PASS — one exported helper owns browser Meta Purchase construction and dispatch ordering.
- `INV-133-002`: PASS — the helper derives `eventId` and `purchasePayload` once and reuses both for Pixel and CAPI.
- `INV-133-003`: PASS — the helper performs only injected analytics calls and isolates their failures; no commerce-state dependency is imported.
- `INV-133-004`: PASS — the unchanged order mutation remains the sole `capturePurchaseCompleted` caller.
- `INV-133-005`: PASS — matching data remains passed to the existing CAPI action and is not added to logging.

## Flow and Architecture Review

`FLOW-133-001` and the approved architecture PASS. Each successful checkout trigger maps local state into a typed `TrackMetaPurchaseInput`; the shared helper performs one Pixel attempt followed by one CAPI attempt and contains failures. `DEP-133-001`, `DEP-133-002`, `INT-133-001`, and `INT-133-002` remain compatible. Dependency injection keeps the event orchestration unit-testable without loading production server configuration.

## Security and Integration Review

`SEC-133-001` PASS. The implementation neither adds customer fields nor changes authorization or the server action boundary. Pixel and CAPI retain the same event ID, CAPI remains a single best-effort request, and no retry or new external integration is introduced.

## Scope and Drift Review

PASS / `NO_DRIFT`. All application changes are within the approved analytics helper and two checkout adapters. Renaming the component-local callback to `trackCompletedPurchase` is an internal compatibility-preserving detail. No approved behavior, interface boundary, or excluded commerce flow changed.

## Test Expectation Review

- `TEXP-133-001`: PASS — focused tests cover full-order and reward values, repeatable split-order IDs, paired payloads, matching data, and empty IDs.
- `TEXP-133-002`: PASS — the regression test inspects both checkout modules for shared delegation and absence of direct Purchase transports; the diff confirms all existing completion call sites remain wired, and the existing PostHog test protects server ownership.
- `TEXP-133-003`: PARTIAL — the helper test exercises Pixel/CAPI pairing and independent failures through controlled transport boundaries, but there is no component/integration journey proving actual checkout navigation continues when a real bound transport fails.
- `TEXP-133-004`: PASS — static diff and focused tests show no added sensitive fields, payload logging, retry, deduplication, or commerce-state mutation.

## Findings

### REV-133-001

- Severity: MEDIUM
- Category: test
- Description: The required checkout-level integration coverage for analytics failure isolation is incomplete.
- Evidence: `TEXP-133-003`; `src/lib/analytics/meta-purchase.test.ts` verifies the real shared helper with injected transports, but neither checkout component has a journey/component test that drives an order-success callback through a failing bound Pixel/CAPI transport and observes continued success behavior.
- Impact: A future checkout wiring change could make analytics failure affect navigation or success UI without the focused helper tests detecting the integration regression.
- Recommendation: Add a narrow checkout integration/component test for one order-success path with failing analytics transports when the checkout test harness can support it reliably.

## Decisions Requiring Attention

None.

## Final Recommendation

The implementation matches the approved REN-133 design with no material drift and no blocking finding. It is ready for commit/PR with `REV-133-001` recorded as a non-blocking test-coverage follow-up.
