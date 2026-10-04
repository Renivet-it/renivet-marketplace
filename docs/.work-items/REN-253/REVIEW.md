# REVIEW: REN-253 — [C0] Payout Containment — residual payout-path controls (no payout authorised)

> Provenance. This file replaces the earlier review that was written against a different implementation (`ayanganguly333/ren-253-c0-payout-containment@dd015220`). That review marked REQ-253-004 and REQ-253-005 PASS, but its code sent no provider-level idempotency key (the "stable reference" was the `cycleKey-brandId` string that already existed on master) and left the Order Operations dashboard page writing `faultOwner` directly. This reconciliation is written against the canonical branch and states only what its code and tests support. It is a corrected reconciliation, not a fresh independent `renivet-review` run; the focused high-risk review is still pending.

## Executive Result

REVIEW_PASSED_WITH_FINDINGS. Base is `master` at `e6ebd297ecbc09ad283d3e5b2e850d1d9f7876be`. Implementation head is `296472ea19bdd248067404ae1b0cace09a6de854` on `ayanganguly333/ren-253-c0-canonical` (seven C0 commits cherry-picked from `7cc3ff9d`, plus one route-level test commit; a governance-only commit follows). No PR exists. Provider-level deduplication is NOT verified, so REQ-253-004, SCN-253-004 and INV-253-004 are PARTIAL. Nothing is deployed, nothing is merged, no payout was cleared or executed.

## Review Scope and Git Evidence

Changed code (13 C0 files plus one new test file): `payouts.ts`, `payout-commission.ts`, `payout-execution-gate.ts`, `payout-statement-access.ts` (new), `rto-attribution.ts` (new), the payout statement route, `order-ops.ts` router, the order-ops dashboard page, `returnReplace.ts`, and tests. No schema, no migration, no production data, no provider execution.

## Requirement Reconciliation

- REQ-253-001: PASS — the category commission fallback is removed from payout item resolution; a line with no matching approved rule gets `blocked_unconfigured` and the execution gate refuses a cycle that contains one. No rate is invented. The fail-closed disposition was ratified by Akshay on 2026-10-03: unconfigured commission lines stay blocked and engineering must not invent a fallback rate.
- REQ-253-002: PASS (after remediation, see Remediation F-1/F-4) — `calculatePayoutCycle` rejects any cycle not in `draft` or `calculated` before reading or replacing line items; creating or approving a payout override on a non-recalculable cycle is rejected as well (see drift note). The independent review found that this guard alone left a partially approved cycle (still `calculated`) recalculable with the old brand approval preserved on a changed amount; recalculation now drops the approval of any brand whose amount changed.
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
- A brand that fails makes the cycle `failed`, and `executePayoutCycle` refuses any cycle that is not `approved`. CORRECTION: the earlier text here claimed re-execution after a failure was blocked at the cycle level. That was wrong: `approvePayoutCycle` had no status guard and reopened a `failed` cycle to `approved`, after which execution sent a second provider POST (reproduced in the independent review). `approvePayoutCycle` now rejects `failed`, `processing` and `completed` cycles.

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

## Remediation after the independent review (F-1, F-4)

Independent adversarial review of this branch at `11769bfc` (read-only, 2026-10-03) found two C0 blockers, both reproduced with probe tests. This section records only the fixes made for them; it is not a fresh review and does not change any PARTIAL or UNKNOWN verdict above.

- F-1 (recalculation after partial approval): approving one brand leaves the cycle `calculated` until every brand is approved, so recalculation (including an applied override) stayed reachable and carried the brand's `reviewStatus`, `approvedBy` and `approvedAt` onto a changed amount. Invariant now enforced in `calculatePayoutCycle` (`invalidateChangedBrandApprovals`): an approved brand amount never stays approved after its `netPayablePaise` changes. A brand whose recalculated amount differs goes back to `pending` / `pending_review` with `approvedBy` and `approvedAt` cleared; a brand whose amount is unchanged keeps its approval. The invalidation is recorded in the `payout_cycle_calculated` audit metadata (`invalidatedApprovals`). The cycle then cannot reach `approved` until the changed brand is approved again, so the changed amount cannot be paid under the old approval.
- F-4 (failed cycle reopened by ordinary approval): `approvePayoutCycle` now only accepts `draft`, `calculated` and `approved` cycles. `failed`, `processing` and `completed` are rejected before any read or write. There is no retry action: a `failed` cycle now stays `failed` until an explicit, audited retry is designed (owner decision, not built here).
- Tests: seven new runtime tests fail on `11769bfc` and pass now; see `payouts.containment.test.ts` (`REN-253 F-1`, `REN-253 F-4`).
- Still open, deliberately not fixed here: provider idempotency remains UNKNOWN and local duplicate-send protection remains incomplete (a crash after the provider accepted and before the summary is persisted still leaves no local mark, and concurrent executions have no local mutual exclusion). Staging, provider and deployment evidence are all still required.
- Known follow-ups, out of this remediation: F-2 override approver is a free-text value supplied by the maker (pre-existing); F-3 whether a BIZ-3 clearance must be invalidated by recalculation (owner decision); F-5 an unset `RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER` marks a brand `completed` with no money moved (pre-existing); F-6 possible Razorpay `reference_id`/`narration` length limits (unverified).

## Remediation after the re-review (F-3, N-1)

The re-review of `521d0b93` (read-only, 2026-10-03) confirmed F-1 and F-4 closed by probe, and left one code blocker (F-3, after the owner decided recalculation must invalidate a BIZ-3 clearance) plus one new finding (N-1). This section records only those two fixes. It does not change any PARTIAL or UNKNOWN verdict above.

- N-1 (approval bound to the amount only): a bank-detail change with an unchanged net amount kept the approval, and the provider was sent the new account. The F-1 invariant now covers the brand's whole payout authority, taken from the existing cycle summary fields: `netPayablePaise` and its components (gross, commission, payment fee, returns, carrier claims, holdback, holdback release, override, TDS), `payoutMethod`, and the payee in `metadata` (`bankAccountNumber`, `bankIfscCode`, `bankAccountHolderName`). Any change drops the approval; the audit metadata (`invalidatedApprovals`) names the changed fields.
- F-3 (clearance survived recalculation): a cycle cleared at 89,900 paise was recalculated to 899,000 and paid on the same clearance. A recalculation that changes any brand's payout authority, or the set of brands, now revokes every unrevoked clearance of the cycle in one statement (`revokeActivePayoutExecutionClearances`, existing columns, no schema change) and writes a `payout_execution_clearance_revoked` finance audit event per clearance (reason `biz_3_clearance_revoked_by_recalculation`); the revoked ids are also in the calculation audit metadata (`revokedClearanceIds`). A recalculation that changes nothing keeps the clearance. The payout path has no transaction, so revocation runs before the new line items and summary are written: a failure in between leaves the old amounts without a clearance, never new amounts under an old clearance.
- Behavioural tests (in `payouts.containment.test.ts`, mocked DB and provider): N-1 account change with the same amount drops the approval, execution is refused with no provider call, and after re-approval the only account sent is the new one; IFSC, account-holder name and payout method changes each drop the approval. F-3 clear at 89,900, recalculate to 899,000, the old clearance is revoked before anything is written and audited, execution is refused (`human_clearance_missing`) with no provider call, a fresh clearance then pays exactly 899,000 once; an unchanged recalculation keeps the clearance; a payee change, an applied override and a brand entering the cycle each revoke it. Eight new tests plus the updated F-1 audit expectation fail against `521d0b93`; all pass now.
- Results (local): containment suite 43/43; `src/lib/finance` + `src/app/api/finance` 119 pass / 1 fail (REN-206 migration-contract test, fails identically on master); full suite 716 pass / 4 skip / 2 fail, the same two failures as master (REN-191 media upload bounds, REN-206 migration contract); TypeScript 821 errors with per-file counts identical to master; governance validation passes.
- Still required before release: provider idempotency remains UNKNOWN (no local claim, persistence after the provider call, `X-Payout-Idempotency` deduplication unverified); RazorpayX test-mode evidence, staging evidence and read-only deployment/migration evidence are all still outstanding; an independent re-review of this commit.
- N-2 (unresolved recovery design): a `failed` cycle is terminal for every mutation, and the only in-system way to pay a failed brand is a new cycle over the same window, which also includes brands already paid in the failed cycle (the settled-order exclusion only reads `completed` cycles) under a different idempotency key. No implicit retry is allowed (owner direction); an explicit, audited recovery design or an operating rule is required before any real payout.
- F-2 (scope decision): the override approver is a value supplied by the maker. F-1 and F-3 now force re-approval and re-clearance after an applied override, but nothing requires the re-approver to be someone other than the maker, so the executor remains the only enforced second person. Fixing this in C0 or deferring it to C1 is an owner decision. F-5, F-6 and the payment-fee observation are unchanged and out of this pass.

## Remediation pass 2 (F-2, F-5, N-2, execution claim, payout basis, G-8)

Independent review of `34d6687f` left three code blockers (F-2, N-2, F-5) and residual flow gaps (G-1, G-2, G-4, G-8, concurrent execution). This pass addresses them without a schema, migration, dependency or environment change. Nothing here is released, deployed or evidenced beyond mocked boundaries.

- **F-2:** an override is created with `approvedBy = null`; only `approvePayoutOverride`, run by a different authenticated admin, applies it, and a second approval is rejected. The approver input is removed from the function, the tRPC input and the workspace form.
- **F-5:** execution is refused before any state change when the payout source account is unset, empty or blank (`PayoutConfigurationError`, audited as `payout_execution_blocked_unconfigured`). The success-shaped `queued_manual_fallback` is removed. Invariant: no source account, no provider call, no completed payout, no synthetic transaction id, no success audit or notification.
- **N-2:** the provider call is classified separately from bookkeeping. Accepted (2xx with a payout id) is recorded as `completed` with the provider's transaction id in its own durable write; a 4xx is `failed`/`rejected`; a network error, timeout, 5xx, 408/409, an unreadable 2xx body or a 2xx without an id is `unknown`, which leaves the brand `processing` (unresolved), halts the loop and is never recorded as failed or paid. A durable `processing` intent is written before every provider call, so a crash or a failed write after acceptance leaves the brand unresolved, never unpaid; if that write fails after acceptance the error names the transaction and nothing is retried. Audit, alert and TDS work after acceptance runs in separate guarded steps that record `bookkeepingPending` and never change the outcome. A later cycle excludes the orders of a brand that is paid or in flight in any other cycle (any status, any payout date) and holds the orders of an unresolved or ambiguously failed brand; only a brand the provider definitely rejected is released. Execution refuses orders that another cycle already paid, holds or left unresolved.
- **Execution claim:** one conditional UPDATE (`approved` → `processing`, only while the stored basis fingerprint still matches) claims the cycle before any provider call; only the claim holder reaches the provider. Application concurrency control only: provider-side idempotency stays UNKNOWN.
- **Payout basis (G-1, G-2, G-4):** a deterministic SHA-256 fingerprint over the cycle, each brand's amount components, payee, payout method, calculated verification state and the digest of its contributing records (order membership included). It is stored in the cycle summary, written into the clearance `metadata`, and required (`expectedBasis`) on approve, clear and execute. Execution refuses a clearance whose basis differs or is missing. Approval and recalculation writes are conditional, so a stale approval cannot overwrite a recalculated cycle and a recalculation cannot overwrite an approved or claimed one.
- **G-8:** immediately before money moves, and again just before each provider call, the current brand verification state is read (`approved` is the only eligible value) together with the live payout method and bank details; any non-approved state or change from the approved payee refuses execution. Reasons name fields, never values.
- **RTO lock and `failed` cycles:** left unchanged. Execution pays the persisted summary and reads no RTO attribution, so the lock gap does not alter a paid or approved amount; leaving `failed` unlocked still lets a definitely rejected brand be corrected and re-paid in a new cycle.
- **Tests:** containment suite plus `payout-basis.test.ts`, `payout-recovery.test.ts` and the gate tests; the cycle mock round-trips through JSON like jsonb. Eight deliberate weakenings of the controls (claim, gate basis, payee check, outcome classification, bookkeeping isolation, cross-cycle exclusion, pre-call intent, stale-screen check) each fail tests. Full suite 801 pass / 4 skip / 2 fail (REN-191 and REN-206, unchanged causes); `tsc` 818 errors (821 before; the three removed were test-fixture typing errors).
- **Not solved / UNKNOWN:** provider idempotency and `reference_id` lookup (no RazorpayX test-mode evidence); SQL atomicity of the conditional UPDATE is by construction, not evidenced on a real database (mocked tests cannot prove it); no staging or deployment/migration evidence; no resolution command for unresolved brands (decision D-C0-1: an unresolved cycle stays stuck by design until a human reconciles with the provider); `completeManualBrandPayout` still writes without a condition; the fingerprint is an unkeyed hash; production verification status and override history unread. RD-1 (order/payment truth) is not touched.

## Decisions Requiring Attention

- Ratified 2026-10-03 (Akshay): the fail-closed commission disposition, and the implementation derived from `7cc3ff9d` as the canonical C0 source. Ayan's extra rule (the approver must also differ from the executor) is NOT adopted unless separately approved. C0 is not production-approved.
- Whether the concurrent-execution residual is acceptable (REV-002).

## Final Recommendation

Proceed to the focused high-risk review of this branch. Do not release until REV-001 evidence, staging negative tests, the Neon snapshot or branch and the deployment/migration verification are recorded and the release decision is made.
