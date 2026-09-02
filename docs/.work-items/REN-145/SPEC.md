# REN-145 Engineering Specification

## Decision

Product decision received: Meta `Purchase` means one event for the full customer
purchase, using the complete cart total. Engineering must not infer this from the
current per-brand order loop.

Linear: REN-145, Urgent, Backlog, `qa-finding`, assigned to Ayan Ganguly. No comments
or blocking relations. The issue confirms the paise defect and identifies fan-out as
a separate defect; historical impact is probable, not quantified.

## Evidence

- `src/app/(protected)/checkout/checkout-content.tsx:468-516` emits Pixel and CAPI
  `Purchase` in `createOrder.onSuccess`, using `variables.totalAmount` directly.
- `src/app/(protected)/checkout/checkout-content.tsx:535-605` groups items by brand
  and creates brand-level payloads; COD/reward paths iterate them.
- `src/app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx:311-362`
  repeats the raw-value Purchase callback.
- `.../order-payment-page.tsx:384-471` groups items and calculates brand totals.
- Both flows already convert `InitiateCheckout` and PostHog purchase amounts with
  `convertPaiseToRupees`; `src/lib/utils.ts:605-607` is the existing helper.
- `src/lib/fbpixel.ts:16-29` maps event IDs to Pixel `eventID`; `src/lib/fb-capi.ts:413-466`
  maps the same ID to CAPI. `trackPurchaseCapi` remains a four-argument wrapper.
- Existing analytics tests cover transport and PostHog behavior, but no test asserts
  Purchase count/value across both checkout UIs.
- Git executable is unavailable. `.git/HEAD` identifies the current branch as
  `ayanganguly333/corporate-order-qc`, not Linear's suggested REN-145 branch. No
  REN-145 work-item artifacts existed before this spec.

## Requirements

- `REQ-001` (explicit): Meta Purchase `value` is numeric INR rupees derived from
  paise with the existing helper; currency remains `INR`.
- `REQ-002` (explicit): Both checkout implementations emit one Purchase for the full
  customer purchase, using the complete cart total and item set.
- `REQ-003` (explicit): Pixel and CAPI describe the same amount, item set, count,
  currency, and logical event.
- `REQ-004` (explicit): Pixel and CAPI share one event ID per logical Purchase.
- `REQ-005` (explicit): InitiateCheckout, PostHog purchase_completed, order creation,
  and kill-switch behavior remain unchanged.
- `REQ-006` (explicit): No historical correction or unsupported multiplier is claimed.
- `REQ-007` (inferred): Eligible zero-pay reward purchases remain zero-valued.
- `REQ-008` (inferred): This task does not introduce a new order/analytics idempotency
  guarantee; retry implications remain coordinated with REN-144.

## Scenarios

- `SCN-001`: Single-brand paid checkout sends correctly valued equivalent Pixel/CAPI events.
- `SCN-002`: Multi-brand checkout matches the approved event count, values, IDs, and items.
- `SCN-003`: Pixel and CAPI for one logical event share an event ID.
- `SCN-004`: Eligible reward checkout preserves zero value and order behavior.
- `SCN-005`: COD and Razorpay use the same approved semantics.
- `SCN-006`: Order failure, retry exhaustion, or CAPI failure preserves existing isolation.
- `SCN-007`: InitiateCheckout and PostHog purchase regressions are absent.
- `SCN-008`: External-side-effect kill-switch behavior is unchanged.
- `SCN-009`: Historical review reports only evidence-supported impact.

## Invariants and flows

- `INV-001`: INR Purchase values are never raw paise integers.
- `INV-002`: Pixel/CAPI use the same event ID and semantic payload.
- `INV-003`: Internal brand splitting cannot add events beyond the approved boundary.
- `INV-004`: Analytics failures remain isolated from order creation and user errors.
- `INV-005`: InitiateCheckout/PostHog monetary units do not change.
- `INV-006`: No historical correction is attempted or claimed.
- `FLOW-001`: Create order payloads, reach the approved success boundary, convert the
  amount to rupees, generate an ID, and dispatch equivalent Pixel/CAPI events.
  Transitions: `checkout_ready -> order_creation_in_progress -> order_created ->
  purchase_event_dispatched`; failure transitions to `order_creation_failed`.
- `FLOW-002`: Preserve retry and analytics-failure isolation without adding an
  idempotency mechanism. Transitions: `order_creation_failed -> retrying`, retrying
  to created or failed, and dispatched to `analytics_failed`.

## Dependencies, integrations, and boundaries

- `DEP-001`: Product semantic decision, unresolved/blocking.
- `DEP-002`: REN-144 order/payment integrity, related for retry/idempotency.
- `DEP-003`: REN-133 and REN-138, recommended coordinated sequencing only.
- `INT-001`: Meta Pixel Purchase transport.
- `INT-002`: Meta Conversions API Purchase transport.
- `INT-003`: PostHog regression reference.
- `PER-001`: Checkout customer, primary actor.
- `PER-002`: Marketing/analytics operator, downstream consumer.
- `SEC-001`: Existing authenticated checkout/server-action boundary for CAPI identity
  and address data; no new identity exposure.
- `BR-001`: INR values are rupees, not paise.
- `BR-002`: Product approval determines event granularity.
- `BR-003`: Shared event ID is required for Pixel/CAPI deduplication.

## Decisions

- `DEC-001`: Full customer order or brand sub-order? Class `HUMAN_CONFIRMATION`,
  resolved by product confirmation: use one full-order event for conversion-count,
  AOV, and ROAS consistency. Consequence high.
- `DEC-002`: Historical correction? `AUTO_DECIDE`, resolved: no; out of scope and
  unsupported.
- `DEC-003`: Bundle related analytics work? `RECOMMEND_CONTINUE`, resolved: coordinate
  sequencing while keeping unrelated behavior out of scope.

## Test expectations

- `TEXP-001` component REQUIRED: single-brand Pixel/CAPI numeric rupee value.
- `TEXP-002` component REQUIRED: multi-brand count/value/items in both UIs.
- `TEXP-003` unit REQUIRED: shared ID and equivalent payloads.
- `TEXP-004` regression REQUIRED: InitiateCheckout/PostHog unchanged.
- `TEXP-005` external_integration REQUIRED: Meta Events Manager sandbox orders.
- `TEXP-006` security REQUIRED: kill-switch behavior unchanged.
- `TEXP-007` exploratory REQUIRED: retry, failures, COD, Razorpay, reward, cart completion.
- `TEXP-008` business_uat OPTIONAL: evidence-bounded historical review.

## Approval gate

The contract is eligible for `READY_FOR_DEV`: `DEC-001` is resolved and the design
reflects one full-order event. No application source, schema, production
configuration/data, QA artifact, or application test was modified.
