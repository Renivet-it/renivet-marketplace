# REVIEW: REN-237 — [FCCP][P1] Return/RTO Fault Attribution & Review

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `MINOR_DRIFT`; governance re-entry is not required. The approved attribution boundary is implemented in commit `ff4df639ad9172e03a78f6d9fa6276a1ab02667e`, compared with merge-base `08d89fbc2a3f23c48b16c6ec1ab8fecc559d6fe3` on `origin/master`. The remaining finding is test-layer coverage, not a failed requirement.

## Review Scope and Git Evidence

The implementation commit changes the existing return/replacement modal, refund creation rules, attribution rules/tests, and `returnReplaceRouter`. The worktree also contains unrelated pre-existing untracked temporary files under `tmp/`; they were not included in the implementation commit.

## Requirement Reconciliation

- REQ-237-001/002/003: PASS. `getAttributionContext`, `setReturnAttribution`, and `setRtoAttribution` expose explicit review state and write the approved authoritative fields.
- REQ-237-004: PASS. `findLockedPayoutCycleForReferences` rejects approved/processing/completed cycles; notes are required for reclassification and sensitive fault owners.
- REQ-237-005: PASS. `writeFinanceAuditEvent` records actor, before value, after value, and the modal reads attribution history.
- REQ-237-006: PASS. Existing evidence grid remains in place and broken images show `Image unavailable`.
- REQ-237-007/008/009/010: PASS. Finance access, MANAGE_ORDERS, explicit-only writes, failure refetch, and persisted downstream fields are present.

## Scenario Reconciliation

SCN-237-001 through SCN-237-010 are covered by the explicit pending state, separate save mutations, payout lock, RTO absence handling, permission-aware controls, audit history, evidence fallback, and mutation error refetch in `returnReplace.ts` and `ReturnReplaceDetailsModal.tsx`.

## Invariant Reconciliation

INV-237-001 through INV-237-007 pass by inspection: customer reason is no longer passed as `costAllocation`, return fields are synchronized in one update, RTO remains in `rto_dispositions`, locked cases fail before mutation, audit writes are explicit, broken evidence is non-fatal, and server procedures enforce authorization.

## Flow and Architecture Review

PASS. Flow B remains the existing review surface. No schema, migration, evidence-storage, Flow A, or REN-236 fee-allocation changes were introduced. The implementation reuses existing finance access, audit, refund policy, and RTO schemas.

## Security and Integration Review

PASS. Refund reads use the `refunds` module view gate, refund writes use its manage gate, and RTO writes retain `MANAGE_ORDERS`. Payout inclusion is checked by refund/RTO/order references and the final fields remain available for REN-236. UploadThing evidence URLs are untouched.

## Scope and Drift Review

`NO_DRIFT` at the contract level. The implementation uses a dedicated context query and explicit mutations, which is compatible with the approved design. No material drift was observed.

## Test Expectation Review

PARTIAL. `return-attribution.test.ts` statically covers notes, lock boundaries, reference matching, and field synchronization. Repository review confirms route/component paths, but dedicated API integration, payout-database, and component-render tests for TEXP-237-002 through TEXP-237-006 are not present in this commit. Focused tests and governance validation were run separately; this review records static coverage only.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: Dedicated route/component/integration tests for the new attribution endpoints and modal states are not present.
- Evidence: `src/lib/finance/return-attribution.test.ts` covers deterministic rules; the implementation commit adds no route or component test file for TEXP-237-002 through TEXP-237-006.
- Impact: Future authorization, lock, audit, and UI regression coverage is weaker than the approved test expectation.
- Recommendation: Add API integration and component tests before expanding the workflow or changing the attribution schema.

## Decisions Requiring Attention

None.

## Final Recommendation

Accept the implementation for review with REV-001 tracked as a non-blocking follow-up. Keep the attribution fields locked after approved-or-later payout inclusion and have REN-236 consume the persisted fields rather than infer fault independently.
