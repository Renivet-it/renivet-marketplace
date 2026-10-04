# REN-255 — RD-1 Slice 1: Order & Payment Truth

## Status

`BLOCKED` pending the R4 design gate and reconciliation of the payment lookup decision.

## Scope

This slice hardens the server-side payment/refund truth boundary only. It covers provider identity binding, amount verification, duplicate-event handling, webhook lookup compatibility, and a stable authoritative transaction-amount contract for RD-2.

It does not cover commission, payout execution, tax policy, refund fault attribution, checkout UI redesign, stock-reservation redesign, or reimplementation of REN-226.

## Evidence reviewed

- REN-255 Linear issue, relations, and comments.
- `src/app/api/webhooks/razorpay/payments/route.ts`.
- `src/app/api/webhooks/razorpay/refunds/route.ts`.
- `src/actions/process-order-after-payment.ts`.
- `src/lib/db/queries/refund.ts` and the `orders`, `orders_intent`, and `refunds` schemas.
- Existing REN-226 refund tests and refund source-of-truth implementation.
- Staging backend fixture: repeated refund recording produced one row; the fixture was removed afterward. This validates only the current DB-layer guard, not the provider webhook path.

## Current-state findings

1. Payment and refund webhooks resolve the order directly from `payload.payload.payment.entity.order_id`.
2. The payment captured path updates stock, order state, e-mail, analytics, and revenue without an observable payment-event idempotency boundary before those effects.
3. The payment path does not visibly compare the provider amount with the authoritative order amount before marking the order paid.
4. `processOrderAfterPayment` accepts browser/action-supplied payment identifiers and marks the intent/order paid without showing provider-side amount and identity reconciliation.
5. The refund query has a transactional existing-row/status guard, and the staging backend fixture confirmed the duplicate call returns `created=false` and `statusChanged=false`.
6. Linear comments contained two lookup decisions. The approved resolution is to use the checkout/order-intent mapping as the authoritative bridge for new events, while preserving legacy Razorpay `order_id` resolution during a bounded migration window.

## Design contract

- Every paid order must have a server-verified provider payment bound to the intended checkout/order record.
- Provider identity and amount must be compared with server-authoritative records before the paid transition.
- Payment and refund events must converge under retries and concurrency without replaying stock, order, e-mail, analytics, revenue, or reward effects.
- New webhook lookup must remain compatible with older events during a documented migration/cutover window.
- Refund source-of-truth remains REN-226; REN-255 addresses only residual identity/idempotency gaps after REN-226 validation.
- The amount contract exposes the authoritative transaction amount, without defining commission or payout policy.
- Invalid signature, unknown order, missing identity, mismatched identity, amount mismatch, malformed payload, or unsupported state must fail closed and remain retryable/auditable.

## Proposed architecture for Critic review

1. Add a durable `payment_event_receipts` table keyed by provider, event type, and provider payment ID, with the bound order/intent, amount in paise, currency, and application status. A unique key makes concurrent duplicate deliveries converge.
2. Resolve new events through the checkout/order-intent mapping. During migration, legacy `order_id` is accepted only when it maps uniquely to the expected server-side order/intent; ambiguity is rejected and logged.
3. In one database transaction, validate identity/amount/currency, claim the event receipt, and transition the order/payment state. A replay returns the existing applied outcome without changing stock or emitting effects.
4. Run stock mutation and durable state transition through the same transaction boundary where possible; external e-mail/analytics/revenue/reward effects run only after a newly applied transition and use the receipt identity for dedupe/retry observability.
5. Route `processOrderAfterPayment` through the same reconciliation service; it may not mark an order paid from browser-supplied status, payment ID, or amount.
6. Derive the refund state through the REN-226 canonical refund boundary; do not introduce a second refund source of truth. REN-255 adds only residual identity/idempotency protection.
7. Expose `transactionAmountPaise` and `currency` from the canonical payment outcome. For legacy orders whose current integer `total_amount` is rupees, the compatibility adapter normalizes `total_amount * 100` to paise and records the provenance; no commission base is calculated.

## Design decisions

- `DEC-255-001`: Use the confirmed staging PostgreSQL database and Razorpay Test Mode only for validation. Resolved by user confirmation; no production data or real-money test.
- `DEC-255-002`: New payment identity uses a server-side provider-to-checkout/order-intent binding, provider payment identity, and amount/currency verification. Legacy Razorpay `order_id` events remain supported during a bounded migration window with ambiguity rejection. Approved by the user on 2026-10-02; the implementation design must still specify the exact cutover mechanics.
- `DEC-255-003`: REN-255 is limited to refund identity/idempotency gaps. REN-226 remains the refund source of truth and is not reimplemented. Approved by the user on 2026-10-02.
- `DEC-255-004`: Persist the unique payment event before business effects. Process the first delivery and ignore identical repeats; concurrent deliveries must converge on one result. Approved by the user on 2026-10-02.
- `DEC-255-005`: Compare and expose the authoritative transaction amount as exact integer minor units (paise) with explicit `INR` currency. REN-255 does not calculate commission or payout amounts. Approved by the user on 2026-10-02.
- `DEC-255-006`: Use a durable `payment_event_receipts` identity boundary and route both webhook and server-action payment transitions through it. Duplicate/concurrent deliveries do not replay effects. This is the implementation design for the approved process-once rule.

## Release and rollback

Validation must run in staging with Razorpay Test Mode, including negative, duplicate, concurrent, retry, and partial-failure cases. Release requires a migration/cutover plan that resolves old events, a rollback to the prior deployment, and monitoring for payment-without-order, amount mismatch, duplicate-event suppression, and stuck reconciliation states.
