# REVIEW: REN-185 — Section 194-O TDS threshold hardcoded ~16-17x too low

## Executive Result

Result: `REVIEW_PASSED_WITH_FINDINGS` with `MINOR_DRIFT` limited to audit-detail completeness. Governance re-entry is not required. The implementation uses gross sales/services, applies the confirmed ₹5,00,000 individual/HUF threshold, adds gross-sales tracking, and keeps historical correction read-only.

Base commit: `60d4f0e77c1accde952205c2784c7ee8512cf8b1` (`origin/master`)

Head commit: `561899f88ad7433155d5f7a2494d7460fbdf56a6`

## Review Scope and Git Evidence

Compared the approved REN-185 contract and Linear issue against the base-to-head diff. Changed implementation paths include the finance schema/query, payout calculation/persistence, TDS calculation, rollover, protected finance route, migration, statement metadata, policy tests, and task-local governance artifacts. The branch has no uncommitted application changes at review time; PR #647 is open.

## Requirement Reconciliation

- REQ-001: PASS. `tds-policy.ts`, `calculations.ts`, `payouts.ts`, and `tds.ts` centralize the approved threshold/base behavior.
- REQ-002: PARTIAL. `auditBrandTdsThreshold` identifies legacy tracking rows and reports TDS evidence without mutation, but does not expand every related payout cycle.
- REQ-003: PASS. The audit is a protected query and no correction/refund/ledger mutation was added.
- REQ-004: PASS. Boundary tests and rollover tracking initialization cover the approved policy.

## Scenario Reconciliation

- SCN-001 and SCN-002: PASS through `computeTdsDeduction` boundary tests and gross-sales inputs in `payouts.ts`.
- SCN-003: PASS through the new sales tracking columns and rollover initialization.
- SCN-004: PARTIAL because the audit returns the last applied cycle ID and withholding totals, not a complete cycle-detail expansion.
- SCN-005: PASS by scope: no correction operation exists in this change.

## Invariant Reconciliation

- INV-001: PASS. No ordinary payout fallback retains the ₹30,000 threshold.
- INV-002: PASS. Existing rows are not rewritten by migration or audit.
- INV-003: PASS for calculation, persisted gross-sales tracking, payout metadata, and rollover.

## Flow and Architecture Review

PASS. The flow is policy constant/resolver → payout preview → tracking persistence/rollover, with the audit exposed separately through the existing finance access boundary. The migration adds nullable-safe integer defaults as non-null zero-valued tracking fields and changes the database threshold default.

## Security and Integration Review

PASS. `auditBrandTdsThreshold` requires `tds_reports` view access. No secrets, external writes, refunds, ledger adjustments, filings, or Linear changes are introduced. The existing upsert remains idempotent on brand and financial year.

## Scope and Drift Review

No material drift. The gross-sales base and individual/HUF eligibility reflect the confirmed statutory decision. The only minor drift is that the read-only audit reports row-level evidence and `lastAppliedCycleId`, rather than fetching a full payout-cycle detail list.

## Test Expectation Review

- TEXP-001: PASS statically. `tds-policy.test.ts` covers below, exact, and above threshold behavior.
- TEXP-002: PASS statically. The implementation updates schema, payout metadata/crossing/persistence, rollover, and migration paths.
- TEXP-003: PASS statically. The pure audit helper demonstrates legacy classification and input non-mutation; the route is finance-authorized.

## Findings

### REV-001

- Severity: LOW
- Category: requirement
- Description: The audit report does not include a complete payout-cycle breakdown for each legacy tracking row.
- Evidence: REQ-002 and SCN-004; `src/lib/finance/tds-policy.ts` reports `lastAppliedCycleId`, cumulative TDS, and annual sales, while `src/lib/finance/tds.ts` does not load cycle details.
- Impact: Finance may need a second report/query to reconcile every affected payout cycle before approving corrections.
- Recommendation: Extend the audit in a follow-up to join completed payout cycles and include cycle dates, gross sales, and TDS withheld per cycle.

## Decisions Requiring Attention

None. The Class C decisions in the approved contract were confirmed: gross sales/services as the base, ₹5,00,000 for individual/HUF, read-only audit first, and no automatic historical corrections.

## Final Recommendation

Approve the implementation for PR review with REV-001 tracked as a non-blocking follow-up. Do not execute historical refunds, ledger adjustments, reversals, or filing changes from this change.
