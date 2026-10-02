# REVIEW: REN-253 — [C0] Payout Containment — residual payout-path controls (no payout authorised)

> Provenance. This file replaces the earlier review that was written against a different implementation (`ayanganguly333/ren-253-c0-payout-containment@dd015220`). That review marked REQ-253-004 and REQ-253-005 PASS, but its code sent no provider-level idempotency key (the "stable reference" was the `cycleKey-brandId` string that already existed on master) and left the Order Operations dashboard page writing `faultOwner` directly. This reconciliation is written against the canonical branch and states only what its code and tests support. It is a corrected reconciliation, not a fresh independent `renivet-review` run; the focused high-risk review is still pending.

## Executive Result

REVIEW_PASSED_WITH_FINDINGS. Base is `master` at `e6ebd297ecbc09ad283d3e5b2e850d1d9f7876be`. Implementation head is `296472ea19bdd248067404ae1b0cace09a6de854` on `ayanganguly333/ren-253-c0-canonical` (seven C0 commits cherry-picked from `7cc3ff9d`, plus one route-level test commit; a governance-only commit follows). No PR exists. Provider-level deduplication is NOT verified, so REQ-253-004, SCN-253-004 and INV-253-004 are PARTIAL. Nothing is deployed, nothing is merged, no payout was cleared or executed.

## Review Scope and Git Evidence

Changed code (13 C0 files plus one new test file): `payouts.ts`, `payout-commission.ts`, `payout-execution-gate.ts`, `payout-statement-access.ts` (new), `rto-attribution.ts` (new), the payout statement route, `order-ops.ts` router, the order-ops dashboard page, `returnReplace.ts`, and tests. No schema, no migration, no production data, no provider execution.

## Requirement Reconciliation

- REQ-253-001: PASS — the category commission fallback is removed from payout item resolution; a line with no matching approved rule gets `blocked_unconfigured` and the execution gate refuses a cycle that contains one. No rate is invented. The fail-closed disposition was ratified by Akshay on 2026-10-03: unconfigured commission lines stay blocked and engineering must not invent a fallback rate.
- REQ-253-002: PASS — `calculatePayoutCycle` rejects any cycle not in `draft` or `calculated` before reading or replacing line items; creating or approving a payout override on a non-recalculable cycle is rejected as well (see drift note).
- REQ-253-003: PASS — the route authorizes before reading payout data: 401 without a session, 403 without payouts finance view/manage access (site Admin inherits). Route-level tests with mocked boundaries cover 401, 403, an authorized view that reaches the data layer, and an authorized PDF response.
- REQ-253-004: PARTIAL — the clearer cannot execute (enforced through the existing execution gate). Repeated execution is guarded by a deterministic `X-Payout-Idempotency` header derived from cycle id and brand id, and by skipping brands that already hold a transaction id or are completed, processing, submitted or awaiting manual confirmation. Whether Razorpay actually deduplicates a repeated key is unverified.
- REQ-253-005: PASS — all three known `faultOwner` writers (Return/Replace `setRtoAttribution`, the Order Operations router, the Order Operations dashboard page) call `checkRtoAttributionWritable` before the write and `recordRtoAttributionAudit` after it. The check and the write are not atomic (see Findings).
- REQ-253-006: PASS — no payout clearance or execution is performed by this change; tests mock the provider and database.

## Scenario Reconciliation

SCN-253-001, -002, -003, -005 and -006 are supported by the changed code and the tests named below. SCN-253-004 is PARTIAL: same-actor rejection and skip-on-existing-transaction are tested; replay protection at the provider is not.

## Invariant Reconciliation

INV-253-001, -002, -003, -005 and -006 hold on the evidence above. INV-253-004 ("one cycle-and-brand identity cannot create two effective payouts") is PARTIAL: it holds locally for a brand already marked, but a crash after the provider accepted the payout and before the cycle summary was persisted leaves no local mark, so the repeat call relies on provider deduplication.

## Flow and Architecture Review

FLOW-253-001 to FLOW-253-004 stay inside the existing finance query/service, API route, execution gate and Return/Replace boundaries. Two behaviours of the execution flow matter for recovery and are stated plainly:

- `executionStatus = "processing"` is only ever assigned in memory inside `executePayoutCycle` and is overwritten before the summary is persisted, so a persisted brand in `processing` cannot arise from this code path. The `processing` and `submitted` entries in the skip list are therefore defensive (`submitted` is never assigned anywhere). The skip that actually matters is the transaction-id check, which also covers a failure after a successful provider call.
- A brand that fails makes the cycle `failed`, and `executePayoutCycle` refuses any cycle that is not `approved`. Re-execution after a failure is therefore blocked at the cycle level (unchanged from master); the fixed idempotency key does not create that block.

## Security and Integration Review

SEC-253-001 is enforced by Clerk authentication plus existing finance module access. SEC-253-002 is enforced through the execution gate (`executedBy` must differ from the clearing admin). SEC-253-003 is enforced by the shared RTO helper. INT-253-001: the idempotency header is sent on the provider call; its effect at Razorpay is unverified. Concurrent execution: two parallel executions of the same cycle both reach the provider with the same key; there is no local mutual exclusion.

## Scope and Drift Review

MINOR_DRIFT. All changes are inside the five controls and the evidence gate. Two items are not named in the approved contract: (1) the guard on creating or approving payout overrides for non-recalculable cycles, needed because an approved override triggers recalculation; (2) `executedBy` added to the execution-gate checks to implement clearer/executor separation inside the existing gate. Neither adds a commercial policy, a migration or a new access model. The earlier branch's additional rule "the approver must also differ from the executor" is NOT part of this implementation and is not in the REN-253 criteria.

## Test Expectation Review

- TEXP-253-001: PASS — runtime tests for fail-closed commission resolution, an approved rule still applying, and the gate blocking a cycle with a blocked line.
- TEXP-253-002: PASS — all six statuses for recalculation, including overrides, with no write on rejection.
- TEXP-253-003: PASS (mocked boundaries) — helper tests plus the route-level tests (401, 403, authorized 404/200). Environment-backed evidence is still required.
- TEXP-253-004: PARTIAL — separation, deterministic key, same key on concurrent replay, and no re-send for processing/submitted/completed/transaction-id are tested against a mocked provider. No test proves provider deduplication.
- TEXP-253-005: PARTIAL — behavioural tests for the lock, notes and audit helper; the claim that all three writers use it is a source-order assertion, not a database-backed test.
- TEXP-253-006: PASS — finance suites run with no production provider or database. Result: 99 pass, 1 fail across `src/lib/finance` and `src/app/api/finance`; the one failure (REN-206 execution-gate migration contract) fails identically on master. TypeScript: no new errors versus master (master has 821 pre-existing errors).

## Findings

### REV-001

- Severity: MEDIUM
- Category: integration
- Description: Provider deduplication of `X-Payout-Idempotency` is unverified.
- Impact: INV-253-004 is unproven at the provider; a crash between a successful provider call and persistence relies entirely on it.
- Recommendation: Verify in a non-production, test-mode setup before any release.

### REV-002

- Severity: LOW
- Category: concurrency
- Description: Two parallel executions both reach the provider; the RTO check-then-write is not atomic.
- Impact: Residual window for a duplicate provider call (mitigated only if the provider deduplicates) and for an RTO write landing around cycle approval.
- Recommendation: Owner decision whether provider deduplication and manual operation suffice for this bounded control; any local guard is a separate change.

### REV-003

- Severity: LOW
- Category: test
- Description: Route authorization and the locked RTO write are tested with mocked boundaries; the three-writer claim is a source-order assertion.
- Recommendation: Environment-backed negative tests during staging validation, without production data.

## Decisions Requiring Attention

- Ratified 2026-10-03 (Akshay): the fail-closed commission disposition, and the implementation derived from `7cc3ff9d` as the canonical C0 source. Ayan's extra rule (the approver must also differ from the executor) is NOT adopted unless separately approved. C0 is not production-approved.
- Whether the concurrent-execution residual is acceptable (REV-002).

## Final Recommendation

Proceed to the focused high-risk review of this branch. Do not release until REV-001 evidence, staging negative tests, the Neon snapshot or branch and the deployment/migration verification are recorded and the release decision is made.
