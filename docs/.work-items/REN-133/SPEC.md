# REN-133 Specification

## Goal

Make checkout purchase instrumentation have one canonical implementation across the cart payment flow and the standalone checkout flow, while preserving the current event payloads, event IDs, failure isolation, and successful-order behavior.

## Evidence and scope

- `order-payment-page.tsx` and `checkout-content.tsx` each define a local `trackMetaPurchase` function with duplicated `fbEvent("Purchase", ...)` and `trackPurchaseCapi(...)` logic.
- The two local implementations are nearly identical but source their item arrays from different checkout state names (`allAvailableItems` versus `availableItems`). Both use `buildMetaPurchaseTrackingEvent`, the same completed order IDs, payable total, user/address metadata, and current URL.
- The server-side `purchase_completed` PostHog event is already centralized in `src/lib/analytics/purchase-events.ts` and invoked by `src/lib/trpc/routes/general/orders.ts` after order creation. This task must not reintroduce client-side `purchase_completed` capture or create a second server event.
- Existing checkout callbacks can be invoked for regular, COD, reward, and split-order completion paths. The refactor must preserve which successful paths invoke tracking and must not change order creation, cart clearing, redirects, or payment behavior.
- In scope: a shared client-safe purchase tracking helper/API, typed input normalization at the two checkout callers, replacement of duplicated browser Meta Pixel/CAPI construction, focused analytics tests, and manual verification across both checkout entry points.
- Out of scope: changing event names or Meta/PostHog schemas, changing server-side order creation, deduplicating callback invocations beyond preserving existing trigger behavior, changing attribution/privacy policy, changing CAPI credentials or backend actions, and unrelated checkout cleanup.

## Acceptance criteria

- Both checkout implementations call the same shared `trackPurchaseCompleted` implementation; neither contains a second copy of the Purchase Pixel/CAPI payload construction.
- The shared implementation produces the same Meta event ID and payload as today for a single order, split orders, COD, reward, and regular Razorpay completion.
- The browser Pixel event and server CAPI event remain paired with the same event ID and current order/product/value fields; existing user/address matching fields remain passed through unchanged.
- Existing server-side `purchase_completed` capture remains the sole PostHog source and is not duplicated by the new client helper.
- Analytics failures remain best-effort: a Pixel or CAPI failure does not throw into order completion, cart clearing, success UI, or navigation. CAPI remains asynchronous as it is today.
- The helper handles an empty completed-order list with the current skip behavior and does not emit a purchase event.
- Focused tests prove the helper is shared by both checkout callers, preserves payload parity and event-ID parity, isolates failures, and leaves the existing server PostHog capture in place.
- Manual verification covers one successful payment/order completion through each checkout entry point and confirms one matched Pixel/CAPI pair per existing completion trigger without changing order count or success navigation.

## Design decision

Add a client-safe shared helper in the existing analytics library. Its typed input should accept completed order IDs, total amount in paise, line items, customer matching fields, and the current page URL (or the already-built URL value), and its implementation should own `buildMetaPurchaseTrackingEvent`, `fbEvent("Purchase", ...)`, and the best-effort `trackPurchaseCapi` call. The helper should return immediately for no completed order IDs, preserve the existing event ID generated from completed order IDs, and catch synchronous Pixel errors plus asynchronous CAPI rejection without affecting checkout.

The two checkout files should only adapt their local state to this shared input and retain their existing callback registration/invocation points. The server order route remains responsible for one `purchase_completed` PostHog event after orders are created. Tests should assert source-level delegation or a narrow exported helper contract rather than relying only on browser globals.

These decisions were explicitly approved for implementation: REN-133 consolidates only the duplicated client Meta Pixel/CAPI implementation; the centralized server-side PostHog capture remains unchanged. Existing callback behavior is preserved without adding retries or new deduplication state.

## Failure, idempotency, and compatibility contract

- A missing/empty order ID list emits no Meta event and logs the existing skip condition.
- A Pixel exception is isolated; CAPI should still be attempted when possible, matching the current sequencing contract.
- A rejected CAPI promise is logged and does not reject the checkout callback.
- No retries or new deduplication state are introduced. Existing event IDs and invocation counts remain unchanged; exactly-once behavior beyond current callback semantics is out of scope.
- The server-side PostHog event continues to be emitted from the order mutation, after successful order creation, with no client-provided analytics payload trusted by the server.

## Invariants

- There is one definition of the browser Meta purchase payload and one event ID per existing purchase-tracking invocation.
- `fbEvent` and `trackPurchaseCapi` receive the same event ID and equivalent purchase payload.
- Analytics code cannot mutate order, payment, cart, customer, or notification state.
- Checkout behavior is independent of analytics availability.
- No purchase event contains new sensitive fields; current matching data remains bounded to the existing analytics action contract.

## Verification plan

- Unit tests for the shared helper: empty IDs, split-order payload construction, event-ID/payload parity, Pixel failure isolation, CAPI rejection isolation, and preserved matching fields.
- Regression/source tests proving both checkout modules delegate to the shared helper and contain no duplicate direct purchase payload construction, while `orders.ts` still calls `capturePurchaseCompleted`.
- Manual browser verification through cart checkout and standalone checkout for regular and applicable alternate completion paths; compare browser Pixel and CAPI request event IDs and confirm order success/navigation is unchanged.
- Governance: run `bun run governance:validate -- docs/.work-items/REN-133/work-item.yaml`; after implementation run `bun test` and the focused analytics test command.
