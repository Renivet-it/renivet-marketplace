# REVIEW: REN-210 — [FCCP][P1] Automate Contracted Payment Fee — Extract Exact Clause Wording First

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`. The implementation follows the user-confirmed formula `max(2% of order total, ₹20)` for Terra Luna only, with a distinct auditable payout line. Drift is `NO_DRIFT`; governance re-entry is not required.

## Review Scope and Git Evidence

- Base branch: `origin/master`
- Comparison base: `25a1b598e428957219eb8677785730429acd191f`
- Head: `83cfcdd63212069ba960e1fc33e8802a48bab0d5`
- PR URL: `null`
- Changed paths: REN-210 governance artifacts, `contracted-payment-fee.ts`, its tests, and the payout calculation integration.

## Requirement Reconciliation

- `REQ-210-001` and `REQ-210-002`: PASS by the user-confirmed formula and immutable metadata in `CONTRACTED_PAYMENT_FEE_METADATA`.
- `REQ-210-003`: PARTIAL because the repository still lacks evidence of the current manual process.
- `REQ-210-004` and `REQ-210-005`: PASS. The deduction is hard-scoped to Terra Luna and no fee is generated for other brands.
- `REQ-210-006`: PASS for a distinct line item and payout-summary deduction; settlement-template runtime rendering remains to be verified.

## Scenario Reconciliation

- `SCN-210-001`, `SCN-210-002`, and `SCN-210-004`: PASS by the confirmed formula helper, boundary tests, Terra Luna guard, and metadata.
- `SCN-210-003`: PARTIAL; manual reconciliation ownership and record are not represented in the repository.
- `SCN-210-005`: PARTIAL; the payout engine creates the line, but a live payout-cycle and statement integration test is not present.

## Invariant Reconciliation

- `INV-210-001`, `INV-210-002`, `INV-210-003`, `INV-210-004`, and `INV-210-005`: PASS by the Terra Luna-only guard, separate `payment_fee` line type, no gateway-cost changes, zero-fee invalid-total behavior, and unchanged unrelated deduction code.

## Flow and Architecture Review

- `FLOW-210-001`: PASS for the confirmed formula boundary and metadata traceability.
- `FLOW-210-002`: PARTIAL because the existing payout input does not expose a distinct Forward/RTO discriminator; the implementation applies to the existing eligible delivered-order path and records both chargeability modes in metadata.
- `DEP-210-001` through `DEP-210-004`: PASS for the confirmed temporary source status and payout integration; manual process evidence remains a follow-up.

## Security and Integration Review

- `SEC-210-001` and `SEC-210-002`: PASS by keeping the calculation inside the server-side payout engine and scoping it to the confirmed Terra Luna brand ID.
- `INT-210-001` and `INT-210-002`: PARTIAL. The line item carries formula, source, approver, and reference metadata, but live database/audit/statement integration is not exercised in this diff.

## Scope and Drift Review

`NO_DRIFT`. The change does not alter commission, TDS, TCS, holdback, Razorpay gateway-cost reporting, historical payouts, or other brands.

## Test Expectation Review

- `TEXP-210-001` and `TEXP-210-003`: PASS — `contracted-payment-fee.test.ts` covers minimum, percentage, invalid totals, and no-fee behavior.
- `TEXP-210-002`: PARTIAL — the manual process remains undocumented.
- `TEXP-210-004` and `TEXP-210-005`: PARTIAL — live payout-cycle, statement, and regression integration coverage remains outstanding.

## Findings

### REV-001

- Severity: MEDIUM
- Category: integration
- Description: The confirmed fee is integrated into the payout calculation, but live Forward/Reverse-RTO, statement rendering, and historical reconciliation tests are not included.
- Evidence: `FLOW-210-002`, `TEXP-210-004`, `TEXP-210-005`, `src/lib/finance/payouts.ts`, and `src/lib/finance/contracted-payment-fee.test.ts`.
- Impact: The arithmetic helper is covered, but production line-item attribution and statement presentation need runtime verification.
- Recommendation: Add a payout-cycle integration fixture for Terra Luna and a settlement-statement assertion before production use.

### REV-002

- Severity: LOW
- Category: integration
- Description: The current manual reconciliation owner/process is not documented in the repository.
- Evidence: `REQ-210-003`, `SCN-210-003`, and the REN-210 reconciliation evidence.
- Impact: Automation cannot yet be compared against the real operational baseline.
- Recommendation: Record the manual process separately without changing the confirmed formula.

## Decisions Requiring Attention

None. The user explicitly confirmed Akshay’s internal approval of the Terra Luna formula.

## Final Recommendation

Accept the implementation for review. It is pushed on `feat/ren-203-spec` as `83cfcdd6`. Complete `REV-001` before relying on the fee in a production payout cycle.
