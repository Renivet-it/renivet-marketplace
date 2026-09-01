# REVIEW: REN-179 — Enforce HSN/GST classification before corporate invoice issuance

## Executive Result

REVIEW_PASSED_WITH_FINDINGS. The implementation is within the approved enforcement-only scope with MINOR_DRIFT. Comparison: `main` merge-base `122a62023fd396f7c94b9889b67a705a09addde1` through head `04eaaf6740844cbb15df6195bd99462ae18790b2`. Governance re-entry is not required.

## Review Scope and Git Evidence

Reviewed the approved READY_FOR_DEV contract, including DEC-002 owner approval, the base-to-head diff, quote/order creation, document issuance, and corporate PDF renderers. The feature branch contains the REN-179 governance artifacts and implementation changes; no uncommitted application changes were present at review start.

## Requirement Reconciliation

- REQ-001/002: PASS — `createQuote`, `createManualQuote`, order creation, proforma issuance, tax invoice issuance, and brand tax invoice recording resolve an active `hsnMaster` row and fail with `PRECONDITION_FAILED` when absent. Manual quote creation now persists and activates an explicitly entered missing HSN row using DEC-002.
- REQ-003: PASS — authoritative rate is used for order tax computation; existing net-per-piece finance calculation remains covered by `src/lib/finance/calculations.test.ts`.
- REQ-004: PASS — order pricing snapshots now persist HSN source, rate, GST amount, and reconciled total; tax invoice rendering validates the same classification.
- REQ-005: PASS — changed corporate issuance/template paths no longer substitute `6109` or generic product GST rates.
- REQ-006: PASS — existing protected service entry points and idempotent issued-document checks remain in place.
- REQ-007: PASS — rates are read from HSN Master data rather than embedded product assumptions.

## Scenario Reconciliation

SCN-001 through SCN-007 and SCN-009 through SCN-011 are PASS from the guarded service paths and persisted snapshot fields. SCN-008 is PARTIAL: legacy documents are fail-closed for newly rendered taxable tax invoices, while a dedicated historical “not available” display policy is still operational follow-up.

## Invariant Reconciliation

INV-001, INV-002, INV-003, INV-004, INV-006, and INV-008 are PASS from the classification helper, service preflights, and snapshot calculations. INV-005 is PARTIAL because older document consumers still accept legacy-shaped payloads; new corporate issuance paths use the validated snapshot. INV-007 is PARTIAL pending an explicit historical display policy.

## Flow and Architecture Review

FLOW-001 and FLOW-002 are implemented through server-side HSN Master lookup before persistence/issuance. FLOW-003 is implemented as safe failure for unresolved new taxable documents; historical compatibility remains a follow-up. The helper in `src/lib/finance/corporate-tax-classification.ts` is the shared fail-closed boundary.

## Security and Integration Review

SEC-001/002/003 remain PASS: classification is server-side, client tax values are not trusted, and existing corporate authorization/order scoping is unchanged. INT-001 through INT-005 are PASS for the enforcement slice; issuance remains dependent on populated authoritative HSN Master data.

## Scope and Drift Review

No material scope drift was observed. MINOR_DRIFT is recorded for legacy-document compatibility being represented by fail-closed behavior rather than a separate “not available” renderer state.

## Test Expectation Review

TEXP-001 through TEXP-004 are supported by the new classification unit tests and the existing finance tests. TEXP-005 and TEXP-006 have static coverage through the guarded service/template paths but would benefit from integration fixtures once pilot HSN Master records are populated.

## Findings

### REV-001

- Severity: LOW
- Category: compatibility
- Description: Historical corporate documents without line-level HSN metadata do not yet have a dedicated “classification not available” presentation policy.
- Evidence: SCN-008/INV-007; `src/components/pdf/corporate-tax-invoice-template.tsx` now fails closed when HSN is unresolved.
- Impact: Re-rendering an incomplete historical artifact may require operator remediation instead of a compatibility display.
- Recommendation: Define and implement the historical display policy as a follow-up before re-rendering legacy documents.

### REV-002

- Severity: LOW
- Category: test
- Description: End-to-end issuance fixtures with populated active HSN Master rows are not present in this slice.
- Evidence: TEXP-005/TEXP-006; coverage is currently unit/static (`src/lib/finance/corporate-tax-classification.test.ts`).
- Impact: Pilot readiness still depends on data and integration verification.
- Recommendation: Add a controlled pilot fixture and run issuance/PDF reconciliation after Finance/CA populates the approved HSN catalog.

## Decisions Requiring Attention

None. Finance/CA catalog population remains an external pilot prerequisite, not an application-code decision.

## Final Recommendation

Accept the enforcement slice with the two low-severity follow-ups. Populate and verify the approved HSN Master records before issuing Mili’s pilot documents, then address the historical compatibility display before re-rendering legacy artifacts.
