# Functional Requirements — P06

## FR-1 (REN-145a): Meta value in rupees
The value passed to `CustomData.setValue()` for the Meta Pixel `Purchase` event (`fbEvent`) and the Meta CAPI `Purchase` event (`trackPurchaseCapi` → `sendCapiEvent`) MUST be the rupee amount (`convertPaiseToRupees(totalAmountPaise)`), matching what the adjacent PostHog `purchase_completed` capture already does. Applies to both call sites: `checkout-content.tsx` and `order-payment-page.tsx`.

## FR-2 (REN-145b): One Purchase event per order, not per brand
The system MUST emit exactly one Meta Purchase event (Pixel + CAPI) and one PostHog `purchase_completed` event per customer checkout, carrying the order's grand total, regardless of how many brand-level order records `buildOrderDetailsByBrand()` creates internally. This requires decoupling the conversion-event firing point from the per-brand `createOrder` mutation's `onSuccess` (which currently fires once per brand order).

## FR-3 (REN-131): Server-side purchase capture
The system MUST emit a `purchase_completed` PostHog event from the order-creation backend path (or an equivalent reliable server-side point, e.g., a payment-confirmation webhook/cron) that does not depend on client JS executing after payment. This may coexist with a client-side event (deduplicated by a shared event ID) or replace the client-side event — either satisfies REN-131; REN-133 governs consolidation.

## FR-4 (REN-133): Single purchase-completion instrumentation path
The system MUST NOT maintain two independently-constructed `purchase_completed` payload-building code paths (`checkout-content.tsx` and `order-payment-page.tsx`). Consolidate into one shared function/module both call sites invoke.

## FR-5 (REN-132): Documented, distinguishable cart-add events
`add_to_cart` (client) and `cart_added` (server) MUST remain distinguishable in any dashboard/report that uses them, with each event's trigger condition documented (see `05-algorithms/DECISION_LOGIC.md`). This is a documentation/consistency requirement, not necessarily a code-unification requirement — the two events serve legitimately different purposes (intent vs. confirmed mutation) and forcing them into one event would lose that distinction.

## FR-6 (REN-134): Correct client naming
`src/lib/posthog/client.tsx` MUST be renamed (or its exports re-homed) to make clear it is the server-side (`posthog-node`) client, distinct from any browser-side (`posthog-js`) usage. Naming/hygiene only; no behavior change required.

## FR-7 (REN-166, V2/V3, DEFERRED): GA4 e-commerce events
IF DECISION-P06-001 resolves in favor of keeping GA4 as a revenue-reporting source, THEN the system MUST emit GA4 e-commerce events (`add_to_cart`, `begin_checkout`, `purchase`, etc.) via `gtag` or equivalent, mirroring the PostHog commerce event set. This requirement is explicitly conditional and MUST NOT be scheduled until the decision is made.

## FR-8 (REN-164, verification, precedes V1 closure on init-timing claims): Confirm or refute init-timing capture loss
Before any dashboard/report relies on early-session PostHog events being complete, the system's PostHog init sequence MUST be verified (not merely inspected) to confirm whether pre-init `capture()` calls are queued and later flushed, or lost. This is a verification task, not a code-change requirement, unless the verification finds a real loss.
