# REN-255 Payment Truth Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

Goal: Complete REN-255 server-side payment binding, duplicate-safe payment transition, migration-compatible lookup, and authoritative amount contract.

Architecture: Persist the Razorpay order reference on each internal order at creation time. Resolve all internal orders for a provider payment using the new reference first and the existing payment-id fallback only when unique and bounded. Apply receipt claim, stock decrement, order transition, and receipt completion in one PostgreSQL transaction; emit existing external effects only after a newly committed transition.

Tech Stack: TypeScript, Bun, Drizzle ORM, PostgreSQL, Razorpay webhook/server action, Bun tests.

Spec: docs/.work-items/REN-255/SPEC.md

Global Constraints:
- Paid means a server-verified provider payment is bound to the intended server order.
- Duplicate/concurrent provider deliveries must not replay stock or irreversible business transitions.
- Legacy provider events remain resolvable during migration; ambiguous matches fail closed.
- Amounts are exact integer paise with explicit INR currency and provenance.
- REN-226 remains the refund source of truth.
- No production data mutation or real-money provider testing.

Review Focus:
- Multi-brand checkout sharing one provider order reference must apply each intended internal order exactly once.
- A failed stock/order transaction must leave the receipt retryable and must not partially decrement stock.
- A provider payment-id fallback matching multiple orders must fail closed.
- A second delivery after an applied receipt must not decrement stock again.
- Legacy orders without the new provider reference must remain resolvable through the bounded fallback.

Task 1: Canonical provider reference
Files: src/lib/db/schema/order.ts, src/lib/validations/order.ts, src/lib/trpc/routes/general/orders.ts, src/lib/db/queries/order.ts, drizzle/0292_ren255_provider_order_reference.sql, tests/ren-255-payment-reconciliation.test.ts
- Add failing tests for provider reference persistence, canonical lookup ordering, and ambiguous fallback rejection.
- Run the focused tests and confirm they fail.
- Add a nullable indexed provider-order-reference field to orders, persist the checkout Razorpay order reference during order creation, and add query methods that return all matching orders by provider reference with payment-id fallback only when the match is unambiguous and bounded.
- Run focused tests and confirm they pass.

Task 2: Atomic payment transition
Files: src/lib/payments/payment-reconciliation.ts, src/lib/db/queries/payment-event.ts, src/lib/db/schema/payment-event.ts, src/lib/db/queries/product.ts, tests/ren-255-payment-reconciliation.test.ts
- Add failing tests for transaction-scoped receipt claim, conditional stock decrement, order transition, applied receipt completion, and retryable rollback.
- Run the focused tests and confirm they fail.
- Implement one Drizzle transaction that claims the receipt, conditionally decrements every item, transitions the order, and marks the receipt applied; any error rolls back all database changes.
- Ensure already-applied receipts return a duplicate result without applying stock/order changes.
- Run focused tests and confirm they pass.

Task 3: Entry-point routing and amount contract
Files: src/app/api/webhooks/razorpay/payments/route.ts, src/actions/process-order-after-payment.ts, src/lib/payments/payment-reconciliation.ts, tests/ren-255-payment-reconciliation.test.ts
- Add failing tests for webhook multi-order resolution, server-action provider verification, canonical amount provenance, and removal of pre-transaction stock/order mutation.
- Run the focused tests and confirm they fail.
- Route webhook and server-action payment transitions through the shared atomic service and preserve existing REN-226 refund wiring.
- Return transactionAmountPaise, currency, and amountProvenance from the canonical applied result.
- Keep external email/analytics/revenue/shipping effects after the committed transition and identify them with the receipt id for retry/monitoring.
- Run focused tests and confirm they pass.

Task 4: Verification and governance
Files: docs/.work-items/REN-255/REVIEW.md, docs/.work-items/REN-255/work-item.yaml
- Run focused REN-255 tests, the full Bun suite, and governance validation.
- Record concrete test output and any environment-limited provider/database evidence.
- Rerun the implementation review against the rebased base/head and record any remaining blockers honestly.
