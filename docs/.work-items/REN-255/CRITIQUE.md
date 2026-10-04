# REN-255 Independent Critic Review

Reviewer: independent fresh-context critic

Mode: read-only; no application files, tests, schemas, or configuration were changed.

## Findings

### CRIT-255-001 — DESIGN_BLOCKER

The approved direct `order_id` lookup decision is not yet sufficient to satisfy REN-255. The issue says the current lookup cannot reliably match checkout orders, and an earlier Linear decision names the checkout/order-intent mapping as the authoritative bridge. The later decision says to use Razorpay `order_id` directly, but does not define how that identifier is server-bound to the correct checkout intent, how ambiguous or reused references are rejected, or how old events are migrated. The design must reconcile these decisions before implementation.

Evidence: `src/app/api/webhooks/razorpay/payments/route.ts:479-482`, `src/app/api/webhooks/razorpay/refunds/route.ts:33-36`, `orders_intent` schema, Linear comments recorded on REN-255.

### CRIT-255-002 — DESIGN_BLOCKER

The payment path has no specified durable payment-event identity or transaction boundary before stock, order, notification, analytics, and revenue effects. A duplicate `payment.captured` delivery can therefore repeat those effects unless the design adds a state transition/outbox/idempotency boundary and defines recovery after a partial failure.

Evidence: `src/app/api/webhooks/razorpay/payments/route.ts:485-745`; stock update occurs before order update and side effects, with no payment-event guard visible in the path.

### CRIT-255-003 — DESIGN_BLOCKER

Amount verification is underspecified. The design must define units, currency, authoritative source, rounding, partial/refund semantics, and behavior for amount mismatch before a payment can become paid. The current payment path uses the provider amount for downstream tracking and does not visibly compare it to the authoritative order amount.

Evidence: `src/app/api/webhooks/razorpay/payments/route.ts:637-740`; `orders.total_amount`; `razorPayRefundWebhookSchema` amount transformation.

### CRIT-255-004 — MAJOR

The refund staging evidence validates the query-layer duplicate guard only. It does not validate signed provider payload acceptance, endpoint behavior, provider retry acknowledgement, side-effect suppression, or concurrent delivery. The test contract must retain a real staging provider-path test and an independent concurrency test.

Evidence: REN-255 Linear comment dated 2026-10-01; `src/app/api/webhooks/razorpay/refunds/route.ts:21-55`.

### CRIT-255-005 — MAJOR

`processOrderAfterPayment` is an additional payment mutation path. The design must either retire it, route it through the same reconciler, or prove it cannot mark an order/intent paid from browser-supplied values. Otherwise webhook hardening can be bypassed by the action path.

Evidence: `src/actions/process-order-after-payment.ts:7-50`.

### CRIT-255-006 — MAJOR

Backward compatibility is not complete until the lookup migration defines old-event resolution, dual-read/dual-write behavior if needed, cutover timing, observability, and rollback. A provider retry can arrive after cutover, so an old event must remain resolvable without applying effects twice.

Evidence: REN-255 acceptance criteria and dependency list; current direct `order_id` lookup in both webhook routes.

### CRIT-255-007 — MINOR

The amount contract needs explicit currency and unit naming rather than an unqualified numeric amount. Without this, RD-2 consumers can interpret paise/rupees inconsistently.

### CRIT-255-008 — NOT APPLICABLE / recorded

No UI redesign or accessibility review is applicable to this backend reconciliation slice, except for preserving existing checkout behavior.

## Required design revisions

1. Reconcile the direct `order_id` approval with the earlier checkout/order-intent bridge decision.
2. Specify a durable payment-event transition/idempotency boundary and partial-failure recovery.
3. Specify amount/currency units and mismatch behavior.
4. Include `processOrderAfterPayment` in the authoritative payment path or explicitly deprecate and guard it.
5. Add the provider-path, concurrency, migration, rollback, and monitoring evidence to the test and release contract.

## Revision review — 2026-10-02

The Architect revised the design after the initial findings. A fresh read-only pass confirms:

- The lookup conflict is resolved: new events use checkout/order-intent binding; legacy `order_id` is compatibility-only and ambiguity is rejected.
- The idempotency boundary is concrete: `payment_event_receipts` claims the canonical event before effects, with a unique identity for concurrent retries.
- The amount contract is concrete: integer paise, explicit INR, legacy rupee normalization with provenance, and mismatch rejection.
- `processOrderAfterPayment` is explicitly required to use the same reconciliation service.
- Provider-path, concurrency, retry, migration, rollback, and monitoring evidence are required before release.

Design disposition: no remaining design blocker. Implementation findings CRIT-255-004 and CRIT-255-005 remain accepted implementation obligations and are represented in the work-item test contract. `READY_FOR_DEV` is appropriate; implementation must not be considered complete until those obligations have evidence.
