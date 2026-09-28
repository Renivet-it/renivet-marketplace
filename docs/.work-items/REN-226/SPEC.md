# REN-226 — Refund Source-of-Truth & Reconciliation (BIZ-9)

Status: `READY_FOR_DEV` — implementation contract prepared from the approved BIZ-9 decision.

## Scope and risk

REN-226 makes the `refunds` table authoritative for refund events and makes order payment status derived state. It adds a reusable reconciliation mechanism for divergences, preserves the existing refund/return business rules, and hardens duplicate-event handling.

This is L3 because it changes payment/refund state transitions, financial records, production-data reconciliation, webhook behavior, and order cancellation paths.

Linear evidence:

- REN-226 is `[FCCP][P1] Implement Refund Source-of-Truth & Reconciliation (BIZ-9)` and is currently Backlog, High priority, assigned to Ayan Ganguly.
- The issue records the approved BIZ-9 decision from 15-Sep-2026: `refunds` is authoritative; `payment_status` is secondary/derived.
- The issue names two known gap cases: master Order 4 and `ORD-EAR-783631-QFJV`. Specification work has no production-data access and therefore does not inspect or mutate them.
- Linear comments were unavailable during this run (`upstream_unavailable`); the issue description and repository evidence are the available contract inputs.

Repository evidence:

- `src/app/api/webhooks/razorpay/refunds/route.ts` updates the order and refund independently in `Promise.all`; the processed webhook can therefore create a status without a refund row.
- `src/lib/db/queries/refund.ts` inserts directly and has no idempotent create operation.
- `src/lib/db/queries/finance-compliance.ts` has `createRefundIfMissing`, but it deduplicates only by order and is not used by every path.
- `src/lib/trpc/routes/general/orders.ts`, `src/app/api/webhooks/razorpay/payments/route.ts`, and `src/lib/support/cancel-order-helper.ts` create refund rows through different paths.
- `src/lib/db/schema/refund.ts` already has unique refund IDs and payment IDs, plus a nullable `razorpayRefundId` field.
- `src/lib/finance/refunds.ts` has the finance refund lifecycle and currently records a generated finance case ID before the gateway refund identifier is known.

## Requirements

- **REQ-226-001:** Treat a persisted `refunds` row as the source of truth for every application refund event; no normal application path may set `paymentStatus = 'refunded'` unless the corresponding refund event row already exists in the same transaction or an explicitly documented equivalent atomic boundary.
- **REQ-226-002:** Centralize refund-event persistence and status derivation so Razorpay webhooks, payment-failure refunds, customer cancellation, support cancellation, and finance refund execution share the same invariant-preserving write boundary.
- **REQ-226-003:** Derive `paymentStatus` from refund state: a processed refund may produce `refunded`, a pending/in-flight refund produces `refund_pending`, and a failed refund produces `refund_failed`; unrelated order/return behavior remains unchanged.
- **REQ-226-004:** Make repeated delivery of the same underlying refund event idempotent. Existing natural identifiers must be reused: gateway refund ID where available, and the existing refund/payment/order identity before gateway completion. A retry must not create a second event or apply a second status transition.
- **REQ-226-005:** Add a reusable reconciliation query/service that detects at least every order with `paymentStatus = 'refunded'` and zero backing refund rows, and reports rather than silently repairs mismatches.
- **REQ-226-006:** Add an ongoing operational trigger using the repository's existing monitoring/cron conventions, with a stable dedupe key and alert details sufficient to identify the order and refund rows without exposing payment secrets.
- **REQ-226-007:** Provide a one-off/read-only report for master Order 4 and `ORD-EAR-783631-QFJV`, and record the observed outcome on REN-226. Any production correction remains a separately approved, auditable action; no bulk backfill is allowed here.
- **REQ-226-008:** Preserve existing refund, return, RTO, payout, notification, analytics, and cancellation rules except for the source-of-truth ordering and idempotency changes required by this contract.
- **REQ-226-009:** Keep schema/query types synchronized. If a database uniqueness/index change is required for the selected natural key, provide an additive, data-safe migration with preflight detection and rollback/recovery documentation.
- **REQ-226-010:** Add deterministic tests for write ordering, missing-row reconciliation, duplicate delivery, failed gateway events, split-payment orders, authorization boundaries, and unchanged downstream behavior.

## Scenarios and invariants

- **SCN-226-001:** A processed Razorpay webhook persists or locates the refund row before deriving `paymentStatus = 'refunded'`; a repeated webhook leaves one refund event and one effective transition.
- **SCN-226-002:** A failed Razorpay webhook persists or locates the refund row and derives `refund_failed`; it never creates `refunded` state.
- **SCN-226-003:** A payment-failure refund, customer cancellation, support cancellation, and finance execution all use the canonical write boundary and cannot produce a status-only refund.
- **SCN-226-004:** Two deliveries for one gateway refund ID converge on one row, including concurrent delivery; a unique conflict is handled as an idempotent replay, not an HTTP 500 or second event.
- **SCN-226-005:** A split-payment order with multiple payment/refund identifiers reconciles each refund event without collapsing unrelated events for the same order.
- **SCN-226-006:** The reconciliation query detects `paymentStatus = 'refunded'` without a refund row and reports the order; it does not auto-correct it.
- **SCN-226-007:** The ongoing reconciliation run emits one deduplicated alert for a persistent mismatch and can report later resolution.
- **SCN-226-008:** The one-off report returns read-only evidence for Order 4 and `ORD-EAR-783631-QFJV`, including order status, refund rows, gateway identifiers, and an explicit outcome classification.
- **SCN-226-009:** Unauthorized callers cannot invoke refund writes or reconciliation actions; webhook signature validation and finance/admin authorization remain enforced.
- **SCN-226-010:** Existing valid refund lifecycle, payout deduction, return/RTO, notification, analytics, and customer-visible behavior remain unchanged outside the specified state-source correction.
- **SCN-226-011:** A database or gateway failure leaves no `refunded` order without a persisted refund event and supports safe retry/recovery.

- **INV-226-001:** Every `orders.paymentStatus = 'refunded'` order has at least one authoritative refund row representing the processed event.
- **INV-226-002:** A refund event is written at most once for its selected natural identity; retries are idempotent.
- **INV-226-003:** Order payment status is derived from refund state and is never the authoritative source for whether a refund occurred.
- **INV-226-004:** Split payments preserve distinct refund events and do not deduplicate solely by order ID.
- **INV-226-005:** Reconciliation is fail-visible and report-only; it never silently changes production financial data.
- **INV-226-006:** Existing authorization, signature validation, secret handling, and audit logging remain intact.
- **INV-226-007:** No downstream refund/return/payout business rule changes unless required to enforce the source-of-truth boundary.
- **INV-226-008:** Repeated webhook, cancellation, cron, and finance execution attempts are safe under concurrency and partial failure.

## Architecture and flow

- **FLOW-226-001 — canonical write:** caller validates its existing business rules -> canonical refund persistence resolves the natural identity -> refund row is inserted or existing row returned -> status transition is derived atomically -> audit/side effects run after durable state.
- **FLOW-226-002 — gateway webhook:** verify signature -> parse event -> load order -> persist/upsert refund event -> derive `refund_pending`/`refunded`/`refund_failed` -> perform existing notifications, analytics, and reward side effects idempotently.
- **FLOW-226-003 — reconciliation:** query orders and refund rows -> classify missing, conflicting, or resolved states -> write bounded audit/alert evidence -> never mutate the order/refund rows automatically.
- **FLOW-226-004 — recovery:** transaction/gateway failure -> leave status at the last valid non-final state -> emit existing-style operational evidence -> replay the same natural event safely.

The preferred implementation is a small domain service used by existing refund query callers, with a transaction-aware database operation. Existing `refunds.id`, `payment_id`, and `razorpay_refund_id` identities must be evaluated before adding a new key. The selected key must support multiple refund events for split payments and must not use timestamps alone. If a new unique index is required, preflight duplicate detection and migration recovery are mandatory.

## Decisions and boundaries

- **DEC-226-001 (APPROVED):** `refunds` is authoritative; order/payment status is derived. Basis: BIZ-9 decision recorded in REN-226.
- **DEC-226-002 (AUTO_DECIDE):** Use one canonical service/query boundary rather than duplicating source-of-truth logic in each webhook/cancellation caller. Basis: existing paths currently diverge and the requirement is cross-path.
- **DEC-226-003 (RECOMMEND_CONTINUE):** Preserve existing non-final statuses (`refund_pending`, `refund_failed`) and map only durable refund lifecycle state to order status. Basis: minimizes downstream behavior change.
- **DEC-226-004 (HUMAN_CONFIRMATION):** Production correction of the two named historical orders is not part of implementation. The implementation may read/report them; any data correction requires an explicitly recorded before/after approval on REN-226.

Security boundary: signed webhooks, authenticated finance/admin procedures, and audit logging remain mandatory. Reconciliation output must not include payment secrets or raw webhook credentials.

Out of scope: redesigning returns/RTO, changing refund eligibility/cost-allocation policy, bulk historical backfill, payout formula changes, customer compensation policy, and unrelated BIZ-8/BIZ-10/BIZ-11 decisions.

## Test expectations

- Unit: canonical status mapping, natural-key selection, duplicate replay, split-payment identity, and report classification.
- Integration: transaction ordering, unique-conflict replay, concurrent webhook delivery, missing-row reconciliation, failed gateway path, and migration/index behavior if schema changes.
- API/security: webhook signature rejection, finance/admin authorization, and no client-controlled refund/order status override.
- Regression: existing refund lifecycle, cancellation, support cancellation, payout deductions, GST credit notes, analytics, notifications, and reward revocation.
- Business UAT: read-only evidence for the two named gap orders, configured alert dedupe, and finance review of source labels/outcomes.

## Approval gate

The Critic review is recorded in `CRITIQUE.md` and `work-item.yaml`. No design blocker remains in the contract; the only production-data decision is explicitly kept outside implementation and requires separate approval. The contract is `READY_FOR_DEV`.
