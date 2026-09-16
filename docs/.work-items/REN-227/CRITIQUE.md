# REN-227 Independent Critique

Reviewer: independent fresh-context critic  
Mode: read-only  
Result: blocked pending trace and eligibility decision

## Findings

### CRIT-227-001 — DESIGN_BLOCKER — qualifying-order population is not yet defined

The issue explicitly rejects assuming all 146 audited orders should have invoices. The implementation needs a state/payment/carrier eligibility matrix before changing the write trigger.

### CRIT-227-002 — DESIGN_BLOCKER — the root cause must be proven across carrier paths

The repository has a Delhivery endpoint that writes `orders.invoice_number`, while Shiprocket generation returns an external URL without updating that field. This is a strong hypothesis, not sufficient proof that every missing number follows from that split.

### CRIT-227-003 — DESIGN_BLOCKER — numbering authority must converge with REN-225

REN-227 must not create a competing invoice format or sequence. Any change to the canonical number format/source belongs to REN-225; REN-227 should make the approved field populate reliably.

### CRIT-227-004 — MAJOR — customer and admin contracts need explicit regression coverage

The customer download route and existing admin order views must be checked independently. A successful external carrier invoice URL is not equivalent to a populated customer-download reference.

### CRIT-227-005 — MAJOR — retry/concurrency and failure observability need executable evidence

The existing Delhivery writer uses a row lock and a unique order field, but all future qualifying paths must be tested for retries, sequence allocation failures, partial errors, and non-overwrite behavior.

### CRIT-227-006 — MINOR — sensitive data must stay out of issue comments and logs

GSTIN, payment, bank, and customer details should not be copied into shared diagnostics. Evidence should use redacted order identifiers and aggregate outcomes.

## Review conclusion

The task is suitable for implementation after the pre-fix trace and eligibility decision are recorded. This critique does not approve `READY_FOR_DEV`.
