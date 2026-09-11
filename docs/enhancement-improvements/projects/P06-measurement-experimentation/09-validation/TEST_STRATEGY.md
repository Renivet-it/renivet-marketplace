# Test Strategy — P06

## REN-145 (currency + fan-out)
- **Unit test**: given a mocked order total in paise, assert the value passed to `sendCapiEvent`/`fbEvent` equals the rupee-converted amount, for both `checkout-content.tsx` and `order-payment-page.tsx` flows (an existing test file, `src/lib/fb-capi.test.ts`, already covers `sendCapiEvent` — extend rather than duplicate).
- **Integration test**: simulate a 2-brand cart checkout; assert exactly one Pixel `Purchase` call and one CAPI `Purchase` call fire (via mocking `fbEvent`/`sendCapiEvent` and counting invocations), with combined value equal to the cart's rupee total.
- **Manual QA**: a real (or staging) multi-brand test checkout, verified via the `capiLogs` dashboard — one row per checkout, correct rupee value.

## REN-131 (server-side capture)
- **Integration test**: simulate an order-creation backend call without invoking any client `onSuccess` handler; assert a `purchase_completed` PostHog capture still occurs server-side.

## REN-133 (consolidation)
- **Regression test**: assert both checkout entry points produce identical `purchase_completed` payload shapes for equivalent input (guards against future drift once consolidated).

## REN-132 (documentation only)
- No code test required. Acceptance is a documentation review (does the dashboard/wiki correctly state trigger semantics per `05-algorithms/DECISION_LOGIC.md`).

## REN-134 (rename)
- **Build/typecheck**: confirm all import sites compile after rename; no runtime test needed beyond existing coverage.

## REN-166 / REN-164
- Out of V1 test scope; see `10-roadmap/` for when these would be tested.
