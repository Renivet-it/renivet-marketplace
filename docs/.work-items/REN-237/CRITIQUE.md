# Critique: REN-237 — Return/RTO Fault Attribution & Review

## Independent repository findings

### CRIT-237-001 — MAJOR — current customer reason inference violates the latest acceptance contract

`src/lib/trpc/routes/general/returnReplace.ts` calls `resolveFinanceRefundReason()` from both `create` and `approveRequest`, then creates a refund with the inferred `costAllocation`. This can create `brand_fault` before any reviewer attribution action. The implementation must change this ordering so customer reason remains advisory and the financial attribution stays pending until explicit review.

References: REQ-237-008, INV-237-001, SCN-237-001, TEXP-237-007.

### CRIT-237-002 — MAJOR — attribution synchronization and payout lock need one atomic server boundary

`refunds.costAllocation` and `refunds.policyBucket` are separate columns, while `calculatePayoutCycle()` rebuilds line items from live refund policy state without a status guard. The new mutation must perform the approved-or-later cycle lookup and the synchronized update in one transaction or equivalent fail-closed boundary; otherwise a partial update or race can rewrite financial attribution.

References: REQ-237-003, REQ-237-004, INV-237-002, INV-237-004, FLOW-237-004, DEP-237-004.

### CRIT-237-003 — MAJOR — existing RTO mutation is not sufficient as a review integration by itself

`src/lib/trpc/routes/general/order-ops.ts` already writes `rto_dispositions.faultOwner` under `MANAGE_ORDERS`, but the return-replace page does not load linked dispositions or expose attribution review. The new review read path must join by the existing order/shipment identity and must not fabricate a disposition when none exists.

References: REQ-237-001, REQ-237-003, SCN-237-005, SCN-237-006, SEC-237-002.

### CRIT-237-004 — MINOR — evidence failure is currently indistinguishable from a valid image element

`ReturnReplaceDetailsModal.tsx` renders evidence with plain `<img>` elements and has no `onError` state. Add a per-image unavailable state while preserving the existing UploadThing-backed URLs and grid.

References: REQ-237-006, SCN-237-007, INV-237-006.

### CRIT-237-005 — MINOR — audit history is not currently attached to attribution review

The repository has `writeFinanceAuditEvent`, but the existing return/replacement mutations are primarily status/shipment flows. Attribution changes need explicit before/after audit events and a read surface; otherwise reviewer history cannot satisfy the latest acceptance criteria.

References: REQ-237-005, SCN-237-010, INV-237-005, TEXP-237-003.

## Critic disposition

The latest Linear remediation comments resolve the business decisions and permit implementation. CRIT-237-001 through CRIT-237-003 are design-critical implementation constraints, not unresolved product decisions. CRIT-237-004 and CRIT-237-005 are required coverage details. No new schema is assumed; schema/migration work is allowed only if implementation proves the existing tables cannot support atomic attribution/audit behavior.
