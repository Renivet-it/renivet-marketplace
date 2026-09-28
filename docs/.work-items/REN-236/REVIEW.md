# REVIEW: REN-236 — [FCCP][P1] RTO Payment Fee & Fault-Based Payout Allocation

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `MINOR_DRIFT`; governance re-entry is not required. The approved REN-236 contract was compared with implementation commit `ff83c300f555d949ed07f2d36eef17b05348516f`, using merge-base `08d89fbc2a3f23c48b16c6ec1ab8fecc559d6fe3` on `origin/master`.

## Review Scope and Git Evidence

The scoped implementation adds the pure fee-allocation policy, RTO disposition lookup, payout line construction, the existing statement deduction inclusion, tests, and REN-236 governance artifacts. Existing admin payout rendering already displays the shared line description and required no component change. Untracked `tmp/` files are unrelated and were not committed.

## Requirement Reconciliation

- REQ-236-001/002/003: PASS. `resolvePaymentFeeOutcome` charges forward and brand-fault RTO fees to the brand and absorbs every other RTO outcome, including absent disposition.
- REQ-236-004: PASS. The existing payout loop, commission, TDS, holdback, and line-item replacement paths remain otherwise unchanged.
- REQ-236-005/006: PASS. The existing fee helper returns zero for invalid totals and the existing order-level set plus replacement persistence prevent duplicate fee lines.
- REQ-236-007/008: PASS. Shared descriptions identify forward, absorbed RTO, and brand-chargeable RTO; the PDF deductions bucket includes `payment_fee` and the admin already renders `line.description`.
- REQ-236-009: PASS. The changed fee path reads only `rtoDispositions` and contains no customer-reason lookup.

## Scenario Reconciliation

SCN-236-001 through SCN-236-009 are supported by the outcome helper, disposition map, zero-fee guard, existing replacement write, shared line description, and existing statement/admin renderers.

## Invariant Reconciliation

INV-236-001 through INV-236-007 pass by inspection. The sole RTO input is persisted `faultOwner`; only brand fault is chargeable; unknown/absent is absorbed; invalid totals emit no line; the line is added once per order; non-RTO logic is retained; and descriptions use adjudicated state.

## Flow and Architecture Review

PASS. The implementation reuses the contracted fee helper, payout line-item plumbing, `rto_dispositions`, PDF statement, and admin payout table. No schema, migration, new dashboard, or independent attribution architecture was added.

## Security and Integration Review

PASS. Chargeability is calculated server-side from persisted RTO disposition data. REN-237 remains the attribution producer; REN-236 does not read customer return reasons or infer fault. Invalid financial input fails safe without charging either party.

## Scope and Drift Review

`NO_DRIFT` at the contract level. The small change to the existing PDF deduction list is explicitly required by the latest ticket content. No unrelated financial rule was changed.

## Test Expectation Review

PARTIAL. `payment-fee-allocation.test.ts` covers forward, brand-fault, all absorbed fault owners, missing attribution, and customer-reason independence; existing contracted-fee tests cover invalid totals. Dedicated database integration coverage for payout line persistence/recalculation and rendered component coverage for both displays are not present in this commit.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: Dedicated payout integration and display tests for the new RTO line metadata are not present.
- Evidence: Pure policy tests exist in `src/lib/finance/payment-fee-allocation.test.ts`; the implementation changes `src/lib/finance/payouts.ts` and the PDF filter without adding database/component integration tests.
- Impact: Future changes could regress disposition lookup, line persistence, or display wording without a focused test failure.
- Recommendation: Add payout-cycle integration and statement/admin component tests before broadening the seller rollout.

## Decisions Requiring Attention

None.

## Final Recommendation

Accept REN-236 for review with REV-001 as a non-blocking follow-up. REN-236 is correctly dependent on REN-237’s persisted attribution and does not introduce a second fault-inference path.
