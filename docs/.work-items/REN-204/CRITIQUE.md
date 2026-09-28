# REN-204 Independent Critique

Reviewer: independent fresh-context critic  
Mode: read-only  
Result: design approved with implementation-validation actions

## Findings

### CRIT-204-001 — DESIGN_BLOCKER — COD/split-payment eligibility semantics require an explicit hold

The issue explicitly leaves the COD/split-payment sub-rule unspecified and identifies REN-212 as the discovery owner. Treating any COD or partial-payment state as paid could create an unauthorized payout; silently excluding it would lose explainability. The requester approved the bounded hold with `cod_reconciliation_pending`.

**Resolution:** implement the approved hold/reason behavior; REN-212 may later define the authoritative reconciliation rule.

### CRIT-204-002 — MAJOR — delivery-date source and missing-date evidence need executable coverage

The current payout path uses shipment delivery, then order update/create time, then the current time. The specification removes those fallbacks, but tests must cover multiple shipment rows, invalid timestamps, exact cycle boundaries, and a delivered order without a shipment row.

**Required action:** add deterministic unit and integration fixtures for delivery-date resolution and explainable exclusion reasons.

### CRIT-204-003 — MAJOR — duplicate protection depends on existing line-item references

The existing payout line-item model stores `referenceId` but has no dedicated settlement marker or order-level payout association. The implementation must define how completed-cycle references are queried and handle legacy rows without inventing a migration.

**Required action:** validate the prior-cycle lookup against completed/settled line items and document the legacy-row behavior.

### CRIT-204-004 — MINOR — payment evidence terminology needs one executable predicate

The schema has `paymentStatus`, `paymentId`, and `paymentMethod`, while COD reconciliation has separate statuses. The implementation should expose one named eligibility predicate so alternate candidate paths cannot bypass the payment gate.

**Required action:** make the predicate reusable and cover every currently producible payment status individually.

## Review conclusion

The design is approved `READY_FOR_DEV`. The remaining findings are implementation and validation obligations, not design blockers.
