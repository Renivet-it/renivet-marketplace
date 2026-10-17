# REN-262 Independent Critique

## Review posture

Fresh-context, read-only review of the REN-262 issue, repository payment paths, schemas, REN-255 boundary, and proposed contract.

## Findings

### CRIT-262-001 — DESIGN_BLOCKER

The design must choose one canonical intent/receipt model for Corporate and general orders. Reusing `payment_event_receipts` as-is is impossible because its required foreign key points to `orders`; a parallel Corporate table risks two idempotency authorities. Evidence: `REQ-262-001`, `REQ-262-003`, `src/lib/db/schema/payment-event.ts`.

### CRIT-262-002 — DESIGN_BLOCKER

Advance capture needs a durable pre-capture record containing the complete validated order snapshot. A draft token and provider notes are not sufficient recovery data if order insertion fails after payment. Evidence: `SCN-262-001`, `SCN-262-004`, `corporate-order.ts` advance confirmation path.

### CRIT-262-003 — MAJOR

Balance and payment-request flows must use a compare-and-set provider-order binding and immutable amount. Otherwise reopening checkout can associate a payment with a newer amount or permit two active captures. Evidence: `SCN-262-002`, `SCN-262-003`, `corporate-payment-request.tsx` and `corporate-order.ts` creation paths.

### CRIT-262-004 — DESIGN_BLOCKER

Overpayment handling is a financial policy decision, not an implementation detail. The contract must reject/refund excess provider capture or define a separately auditable excess/refund outcome; silently clamping the database amount is unsafe. Evidence: `SCN-262-006`, current `applyVerifiedPayment` clamp.

### CRIT-262-005 — MAJOR

Webhook recovery requires a durable mapping from provider order/payment to a Corporate intent and a safe operator path for provider-paid/no-order. A webhook that only searches `corporateOrders` cannot recover the current advance flow because no order exists before capture. Evidence: `SCN-262-004`, `SCN-262-005`.

### CRIT-262-006 — MAJOR

Receipt voucher, proforma, order status, request status, and payment row must be committed atomically or have an explicit retryable completion state. Current document creation occurs after payment writes and can leave a paid order without documents. Evidence: `REQ-262-003`, `SCN-262-007`, `corporateDocumentService` calls.

### CRIT-262-007 — MINOR

The specification should make observability concrete: intent ID, provider order/payment ID hashes or safe identifiers, outcome, mismatch reason, retry count, and orphan age; never log signatures or secrets.

## Gate result

`APPROVED_WITH_CONDITIONS`. The owner explicitly approved the recommended decisions: dedicated Corporate intent boundary, fail-closed overpayment with auditable refund, and finance-authorized recovery from an immutable validated intent. CRIT-262-001, CRIT-262-002, and CRIT-262-004 are resolved by those decisions. The remaining major/minor findings are implementation obligations and must be covered by tests and review evidence.
