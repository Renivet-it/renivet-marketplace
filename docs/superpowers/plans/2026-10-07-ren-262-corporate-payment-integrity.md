# REN-262 Corporate Payment Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure Corporate advance, balance, and payment-request payments cannot be captured or applied without a durable server-side intent, exact provider binding, idempotent persistence, and recoverable completion.

**Architecture:** Add a dedicated Corporate payment-intent boundary and a shared reconciliation service. Checkout creates an immutable intent before provider capture; browser confirmation, webhook delivery, and operator recovery all call the same verified transition. Payment/order/document state is committed transactionally where possible and otherwise represented by explicit retryable completion state.

**Tech Stack:** Next.js/TypeScript, Drizzle ORM, PostgreSQL, Razorpay, Bun tests.

**Spec:** `docs/.work-items/REN-262/SPEC.md`

## Global Constraints

- Never trust browser-supplied amount, currency, provider order identity, or payment status.
- Never silently clamp an overpayment; reject before capture or record an auditable refund outcome.
- A provider payment identity has at most one Corporate economic outcome.
- Recovery may reconstruct only from an immutable validated pre-capture intent and requires finance/admin authorization.
- Use Razorpay Test Mode and non-production PostgreSQL for external verification.

## Review Focus

- Advance validation failure before capture: no provider order or paid Corporate state.
- Concurrent confirmation/webhook delivery: one payment, one order transition, and one document outcome.
- Provider order/amount/currency mismatch: fail closed with an auditable rejection.
- Lost browser callback: signed webhook/reconciliation completes the existing intent without re-payment.
- Provider-paid/no-order: authorized recovery uses only the immutable intent snapshot.

### Task 1: Corporate intent and uniqueness schema

**Files:**
- Create/modify: `src/lib/db/schema/corporate-payment.ts`
- Modify: `src/lib/db/schema/index.ts`
- Create: Drizzle migration for Corporate payment intents, provider identity uniqueness, and refund/recovery state.
- Test: schema/query integration tests.

- [ ] Add immutable intent fields for Corporate order/request identity, customer, payment kind, exact paise amount, currency, provider order/payment IDs, lifecycle, expiry, and order snapshot.
- [ ] Add unique constraints for provider order identity and provider payment identity.
- [ ] Add indexes for recovery and webhook lookup.
- [ ] Generate and inspect the migration; ensure no existing general-order foreign key is weakened.
- [ ] Run the schema integration tests and migration validator.
- [ ] Commit the schema boundary.

### Task 2: Verified reconciliation service

**Files:**
- Create: `src/lib/services/corporate-payment-reconciliation.ts`
- Modify: existing Corporate payment/order/document service modules only where required by the service interface.
- Test: unit and database integration tests for reconciliation.

- [ ] Implement provider lookup and verification of signature, provider order/payment identity, captured status, exact amount, and INR currency against the immutable intent.
- [ ] Implement transactional claim by unique provider payment identity and deterministic replay behavior.
- [ ] Implement advance recovery from the immutable order snapshot and balance/payment-request application using compare-and-set binding.
- [ ] Implement explicit invalid, expired, partial, and overpayment rejection/refund states.
- [ ] Make receipt/proforma/status side effects idempotent and retryable.
- [ ] Add tests for mismatches, duplicate/concurrent application, rollback, and retry.
- [ ] Commit the reconciliation service.

### Task 3: Checkout and confirmation integration

**Files:**
- Modify: `src/lib/services/corporate-order.ts`
- Modify: `src/lib/services/corporate-payment-request.tsx`
- Modify: relevant Corporate API/TRPC routes.
- Test: route/service integration tests.

- [ ] Replace browser draft-token economics with server-side intent creation before provider order creation/capture.
- [ ] Bind provider order IDs with compare-and-set and prevent active binding replacement.
- [ ] Route advance, balance, and payment-request confirmation through reconciliation.
- [ ] Preserve authorization and customer/tenant binding checks.
- [ ] Add tests proving invalid pre-capture order data prevents capture and valid flows converge on one outcome.
- [ ] Commit integration changes.

### Task 4: Webhook and operator recovery

**Files:**
- Create: Corporate Razorpay webhook route under `src/app/api/...`
- Create/modify: authorized operator reconciliation action/report.
- Test: webhook/recovery integration tests.

- [ ] Verify webhook signature and provider event identity.
- [ ] Reconcile captured/failed events through the shared service and acknowledge only after durable processing.
- [ ] Surface unknown, ambiguous, orphaned, and provider-paid/no-order states without exposing secrets.
- [ ] Require finance/admin authorization for manual recovery and record the evidence.
- [ ] Add lost-callback, provider retry, and recovery tests.
- [ ] Commit webhook/recovery changes.

### Task 5: Full verification and review

- [ ] Run `bun test`.
- [ ] Run `bun run governance:validate -- docs/.work-items/REN-262/work-item.yaml`.
- [ ] Run TypeScript/build checks relevant to changed routes and services.
- [ ] Verify migration metadata and local non-production database behavior.
- [ ] Run `renivet-review REN-262` against the implementation diff.
- [ ] Record evidence in the task-local governance artifacts and prepare the PR.
