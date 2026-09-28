# REVIEW: REN-205 — [FCCP][P0] Suspend the Unauthorized 5% Holdback Deduction (BIZ-15)

## Management Decision Addendum (2026-09-20)

**The real `2026-06-H2` payout cycle must not be recalculated to satisfy this review's outstanding items.** Management has directed that REN-205's remaining validation (REV-205-002 below, and the related TEXP-205-004/005/006 items) be completed against an **equivalent synthetic/non-production payout-cycle fixture** instead — one with the same structural characteristics (line-item types, brand summaries, metadata fields) as a real cycle. This addendum does not change any PASS/PARTIAL verdict recorded below; it changes only which fixture satisfies the still-open findings. The original text's references to `2026-06-H2` are preserved unedited below as historical context — they reflect what was approved at the time this review was written, not the current instruction.

## Executive Result

REVIEW_PASSED_WITH_FINDINGS. The implementation is within the approved REN-205 contract with NO_DRIFT. The real payout path suspends holdback regardless of configuration, preserves the capability and historical line representation, exposes BIZ-15 metadata, and avoids a release adjustment when no current holdback was taken. Controlled production configuration inspection and the approved 2026-06-H2 fixture still need to be run before release validation. Governance re-entry is not required.

Base: `origin/master` at `16bde07a7445326100ad0bc5eb65766bcb620a24`.

Head: `43c3ba9ca2825bf85f5fbaf940bb08183f285c1e`.

## Review Scope and Git Evidence

Compared the approved REN-205 work item and Linear issue with `origin/master..43c3ba9ca2825bf85f5fbaf940bb08183f285c1e`. The implementation changes only the payout holdback calculation path and adds focused unit coverage. No migration, schema deletion, configuration mutation, order/payment write, approval, or execution change was introduced.

## Requirement Reconciliation

- REQ-205-001 / REQ-205-002: PASS. `calculateHoldbackPaise` returns zero on the real path and the active payout metadata uses zero rather than a 500 bps fallback.
- REQ-205-003: PASS. The holdback helper and existing schema/line-item/release code remain present; the enabled arithmetic branch is available only through an explicit test option.
- REQ-205-004 / REQ-205-005: PASS. BIZ-15 metadata is persisted in cycle brand metadata, no zero-value line is emitted, and release computation is skipped when the current cycle took no holdback.
- REQ-205-006: PASS. No unrelated deduction or payout state path was changed.
- REQ-205-007: PARTIAL pending controlled fixture and configuration evidence.

## Scenario Reconciliation

SCN-205-001 through SCN-205-007 are supported by the helper, payout integration, and preserved line-item behavior. SCN-205-008 is not executable from this review because the production configuration environment was not accessed; no production data was changed.

## Invariant Reconciliation

INV-205-001 through INV-205-005 are preserved: real holdback is zero, null/configured values cannot enable it, historical capability remains, no release is created without a current holdback, and unrelated state is untouched.

## Flow and Architecture Review

FLOW-205-001 is implemented through `calculateHoldbackPaise` and `getHoldbackPolicyMetadata` before line creation. FLOW-205-002 is preserved as an isolated explicit option in the helper. FLOW-205-003 remains calculation-only and does not alter approval or execution transitions.

DEP-205-001 through DEP-205-004 and INT-205-001/INT-205-002 remain within existing payout and statement interfaces. Statement rendering continues to derive holdback visibility from actual line items; no new holdback line is emitted under suspension.

## Security and Integration Review

SEC-205-001 is satisfied statically: the BIZ-15 marker contains only authority and reason values, with no bank, customer, credential, or provider payload data. The implementation does not write production configuration or payment/order data.

## Scope and Drift Review

NO_DRIFT. The implementation does not delete holdback schema or history, re-enable holdback, alter commission/TDS/TCS/returns/claims, execute or approve payouts, or add migrations.

## Test Expectation Review

- TEXP-205-001, TEXP-205-002, and TEXP-205-003: PASS by `src/lib/finance/payout-holdback.test.ts` and the guarded release path.
- TEXP-205-004, TEXP-205-005, and TEXP-205-006: PARTIAL. Static code supports the required cycle and statement behavior, but the 2026-06-H2 fixture and rendered statement have not been run in a controlled environment.
- TEXP-205-007 and TEXP-205-008: PARTIAL. The code is read-only and bounded, but current production configuration evidence and finance UAT remain outstanding.

## Findings

### REV-205-001

- Severity: MEDIUM
- Category: integration
- Description: The required controlled read-only inspection of current production holdback configuration has not been performed.
- Evidence: REQ-205-006, REQ-205-007, SCN-205-008, TEXP-205-007, and the approved REN-205 uncertainty; no production configuration access or output is present in the implementation diff.
- Impact: The safe code path is verified, but the required environment-specific evidence that no configuration currently enables holdback is incomplete.
- Recommendation: Inspect current holdback configuration read-only, report bounded brand/configuration findings on the issue, and do not mutate values.

### REV-205-002

- Severity: LOW
- Category: test
- Description: The approved 2026-06-H2 integration and statement regression has not been executed.
- Evidence: TEXP-205-004 through TEXP-205-006; focused unit coverage exists, but no cycle fixture or rendered statement evidence is present.
- Impact: Runtime confirmation that no new holdback line appears and historical lines remain representable is still outstanding.
- Recommendation: Recalculate the approved fixture in a controlled read-only environment and record line-type, metadata, net-payable, and statement results.

## Decisions Requiring Attention

None. BIZ-15 remains suspended; no re-authorization is implied.

## Final Recommendation

Accept the implementation as `REVIEW_PASSED_WITH_FINDINGS` for REN-205. Complete REV-205-001 and REV-205-002 before release validation. No governance re-entry is required.
