# REVIEW: REN-180 — Corporate document data integrity: invalid date, missing GSTIN/HSN, wrong seller identity framing

## Executive Result

`REVIEW_FAILED` with `MATERIAL_DRIFT`; governance re-entry is required. Date/GSTIN/HSN gates, seller wording, and shared sequence allocation are implemented, but several approved requirements remain incomplete.

## Review Scope and Git Evidence

Compared merge-base `0423b6be32340155d480aa5fc49d3f88eeff1523` to head `62ba9db634f7edbd58cb5a26a74a6016b38137b1` on the REN-180 branch. Relevant implementation files include the PI download route, tax-invoice route, commission route, integrity helper, and REN-180 tests.

## Requirement Reconciliation

- REQ-001/REQ-002: PARTIAL — safe date resolution and GSTIN/HSN presence gates are implemented in PI/tax invoice routes.
- REQ-003: PARTIAL — PI fallback no longer hard-codes 18%, but canonical snapshot/tax-master adapter is not fully wired.
- REQ-004: PARTIAL — Renivet seller and facilitator removal are implemented; fulfillment-party rendering is incomplete on tax invoice.
- REQ-005: FAIL — explicit `shipTo` payload/model and conditional shipping rows are not implemented.
- REQ-006: PARTIAL — shared CINV allocation is used, but number persistence across retries is not implemented.
- REQ-007: FAIL — order summary still reads raw advance/balance fields.
- REQ-008: PASS — existing authorization paths remain in place.

## Scenario Reconciliation

SCN-001/002/003/005 are partially covered; SCN-004, SCN-006, and SCN-007 fail the snapshot, retry-stability, and canonical-payment portions; SCN-008 remains covered by existing authorization checks.

## Invariant Reconciliation

INV-001/002/004 are supported by the new gates/payload. INV-003 and INV-005 are not satisfied until snapshot reconciliation and persistent commission numbering are added. INV-006 remains supported by existing route authorization.

## Flow and Architecture Review

The date/tax helper is a focused boundary, but the canonical snapshot adapter and explicit Bill To/Ship To document model from FLOW-001 are missing. The branch also contains inherited REN-175/176/178/179 changes from its merge-base; those are outside this task’s implementation scope.

## Security and Integration Review

Existing authentication/authorization is preserved (SEC-001/SEC-002). The shared sequence integration is called, but retry idempotency and persisted ownership are absent (INT-001/INT-002).

## Scope and Drift Review

Material drift: required document data and payment/numbering state remain independently derived in some paths.

## Test Expectation Review

TEXP-001 and focused helper coverage are present. TEXP-002/003/004 require additional snapshot, ship-to, and persistent-number integration tests. TEXP-005 is covered by existing authorization tests but needs route-level PII assertions.

## Findings

### REV-001

- Severity: BLOCKER
- Category: requirement
- Description: Ship To and no-shipping-row behavior are not implemented.
- Evidence: REQ-005/SCN-005; corporate commercial template still exposes only from/to parties.
- Impact: Customer-facing documents can omit required delivery identity or show inconsistent shipping presentation.
- Recommendation: Add explicit `shipTo` payload and conditional shipping-row rendering.

### REV-002

- Severity: BLOCKER
- Category: invariant
- Description: Canonical snapshot/payment reconciliation is incomplete.
- Evidence: REQ-007/INV-003; `corporate-order-summary-template.tsx` still renders raw order advance/balance fields.
- Impact: PI, invoice, settlement, and summary can diverge.
- Recommendation: Wire all readers to REN-177 snapshot/payment state.

### REV-003

- Severity: HIGH
- Category: integration
- Description: Commission number is allocated on every download and is not persisted.
- Evidence: REQ-006/INV-005; commission route calls `nextCorporateDocumentNumber("CINV")` per request.
- Impact: Retries/downloads can create multiple numbers for one commission document.
- Recommendation: Persist one commission document number and reuse it transactionally.

## Decisions Requiring Attention

None; owner-confirmed decisions are recorded in the work item.

## Final Recommendation

Keep REN-180 in `IN_REVIEW`, implement REV-001 through REV-003, then rerun `$renivet-review REN-180`.
