# REN-262 — Corporate payment/order integrity

## Status

`READY_FOR_DEV` after independent Critic review and explicit approval of the three design decisions below.

## Scope

Harden both Corporate payment journeys: advance payment that currently creates the Corporate order after browser confirmation, and balance/payment-request checkout against an existing Corporate order. The implementation must establish a server-side payment/order intent before capture, verify provider identity and exact amount, make persistence idempotent under replay/concurrency, and recover lost callbacks through the Corporate payment webhook/reconciliation path.

Out of scope: general-catalog orders, payout/commission policy, tax policy, UI redesign, production deployment, real-money testing, and the later end-to-end staging task REN-276.

## Evidence reviewed

- REN-262 Linear description, priority, status, branch, parent, relations, and no issue comments.
- `src/lib/services/corporate-order.ts` advance and balance payment creation/confirmation paths.
- `src/lib/services/corporate-payment-request.tsx` account/public payment-request checkout and confirmation paths.
- `src/lib/db/schema/corporate-order.ts`, `corporate-platform.ts`, and `src/lib/db/queries/corporate-order.ts`.
- Corporate payment routes, TRPC routes, order confirmation components, and existing payment/event schemas.
- REN-255 shared payment receipt boundary and migration, which is related but currently references only the general `orders` table.
- Existing Corporate document/receipt/proforma services and migration journal.

## Current-state findings

1. Advance checkout creates a Razorpay order and signs a browser draft token, but no durable Corporate order or payment intent exists before capture.
2. `confirmAdvancePayment` validates only the draft token, Razorpay order ID, and signature; it does not fetch the provider payment, verify provider amount/currency, or transactionally create the Corporate order, payment, receipt voucher, and proforma.
3. Balance checkout creates a Razorpay order from the current `balanceDuePaise`, but the provider order ID and amount are not durably bound to the order before capture. Confirmation trusts the browser-supplied payment ID/signature and writes order/payment state in separate operations.
4. Payment-request checkout has a durable request row, but confirmation does not verify the provider payment amount/currency and `applyVerifiedPayment` reads collected amount before its transaction, allowing concurrent over-application and duplicate side effects.
5. `corporatePayments` has lookup indexes but no provider-payment uniqueness. `corporatePaymentRequests.razorpayPaymentId` is unique, but the broader advance/balance paths can bypass that table.
6. No Corporate payment webhook/reconciliation route maps a signed provider event to a Corporate order or payment request, so a lost browser callback cannot recover without another client confirmation.
7. The existing REN-255 `payment_event_receipts` boundary is tied by foreign key to general `orders`; it cannot be reused for Corporate rows without an explicit polymorphic/Corporate-compatible design.

## Design contract

- A provider capture must be bound to a durable Corporate payment intent before capture, including Corporate order/quote identity, payment kind, exact paise amount, INR currency, user/customer binding, and provider order ID.
- Required Corporate order data and authoritative economics must validate before creating a provider order or accepting capture.
- Provider payment ID, provider order ID, amount, currency, and signature must be verified server-side; browser-supplied status or amount cannot authorize payment.
- One provider payment can create at most one Corporate economic outcome, including order/payment/request/receipt/proforma effects.
- Advance and balance journeys must use the same reconciliation/transition service; payment-request/manual paths must preserve their explicit bounded behavior.
- Signed provider webhook delivery and a safe operator reconciliation path must recover a paid provider event when the browser callback is lost, without re-payment or duplicate documents.
- Partial/over-balance payments are rejected or bounded by an explicit approved policy; no silent clamping may turn an invalid provider capture into a valid economic result.
- Failed transitions remain retryable and auditable without a false paid order or duplicate stock/document/notification effect.

## Proposed architecture for Critic review

1. Add a Corporate payment-intent table or an explicitly polymorphic intent extension with immutable order/quote/payment-kind/amount/currency/provider-order binding, lifecycle status, expiry, and unique provider-order identity.
2. For advance checkout, validate/build the full order snapshot first, persist the intent and all required order data in a transaction, then create Razorpay order and durably bind its returned ID with a compare-and-set update. Never use a browser draft token as the economic source of truth.
3. For balance and payment-request checkout, create the intent from a locked/current Corporate order and outstanding amount. Reopening checkout must not overwrite an existing active provider-order binding without an explicit expired/cancelled transition.
4. Create one Corporate reconciliation service used by browser confirmation, payment webhook, and operator recovery. It fetches/verifies the provider payment, checks intent/order binding and exact amount/currency, claims a unique provider payment, then transactionally writes Corporate payment, order/request status, and receipt/proforma records.
5. Keep external e-mail/PDF/notification work after the durable transition, keyed by the applied receipt/intent identity. Replays return the existing outcome and emit no duplicate irreversible effects.
6. Add a signed Razorpay payment webhook route that resolves Corporate payment intents by provider order/payment ID, handles captured/failed events, acknowledges only after durable processing, and leaves unknown/ambiguous events visible for operator recovery.
7. Add a bounded operator reconciliation action/report for provider-paid/no-order or provider-paid/unapplied intents. It must require finance/admin authorization, provider lookup evidence, current amount/order binding, and idempotent completion.

## Release and rollback

Required evidence is non-production PostgreSQL plus Razorpay Test Mode: valid advance, valid balance, forced pre-capture validation failure, wrong order/amount/currency, duplicate and concurrent confirmation, lost browser callback with webhook recovery, provider retry, partial/over-balance, and provider-paid/no-order recovery. Release requires migration backup/rollback, monitoring for orphaned intents and provider-paid/no-order, and no production mutation during validation.

## Approved decisions

- Corporate uses a dedicated payment-intent table and Corporate-compatible receipt/reconciliation records. REN-255's general-order receipt table is not generalized in this task; shared behavior is provided by the reconciliation service contract.
- Overpayments fail closed before capture where possible. If Razorpay reports a provider-paid excess, the applied Corporate amount remains the verified intended amount and the excess is refunded through an auditable, retryable refund record; no silent clamping is allowed.
- Finance-authorized recovery may create a missing Corporate order only from an immutable, validated pre-capture intent, with exact customer/quote/order snapshot, provider binding, audit evidence, and idempotent completion.
