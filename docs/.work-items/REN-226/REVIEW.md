# REVIEW: REN-226 — [FCCP][P1] Implement Refund Source-of-Truth & Reconciliation (BIZ-9)

## Executive Result

Result: `REVIEW_FAILED`  
Drift: `NO_DRIFT`  
Comparison base: `004e7e93fb037a7ff4583ca6504548302aad0800` (approved REN-226 specification commit)  
Head: `47084851123be53d6c85245262a0ce6e8cdf07e8`  
Governance re-entry: `false`

The implementation stays within the approved architecture and has no material behavioral drift, but two required delivery conditions remain unproven: the named production gap-case outcomes and database/concurrent integration evidence. The repository implementation provides the read-only reporting path and canonical transaction logic; it cannot truthfully claim those operational outcomes without controlled production/staging evidence.

## Review Scope and Git Evidence

The comparison is the task-local stacked-branch diff from the REN-226 specification commit through `47084851123be53d6c85245262a0ce6e8cdf07e8`. The worktree was clean at review time. The current branch is `feat/ren-229-spec`; the Linear suggested branch is different, so the task-local stacked base is used and the branch difference is recorded rather than silently changed.

Changed implementation areas:

- `src/lib/db/queries/refund.ts`: transactional event recording, split-payment aggregate status, and reconciliation query.
- `src/app/api/webhooks/razorpay/refunds/route.ts`: canonical processed/failed webhook path and duplicate side-effect guard.
- `src/app/api/webhooks/razorpay/payments/route.ts`, `src/lib/support/cancel-order-helper.ts`, `src/lib/trpc/routes/general/orders.ts`, and `src/lib/finance/refunds.ts`: canonical pending/final refund writes.
- `src/lib/finance/refund-source-of-truth.ts` and `src/lib/finance/refund-reconciliation.ts`: pure rules, report classification, and operational runner.
- `src/app/api/cron/refund-reconciliation/route.ts`: authenticated report/alert endpoint.
- Focused unit tests for state derivation, identity, split payments, replay, and report classification.

Verification evidence available before this read-only review: focused REN-226 tests pass; `bunx drizzle-kit check` passes; governance validation passes. The full suite remains repository-red with unrelated existing failures/errors, recorded in the handoff rather than attributed to REN-226.

## Requirement Reconciliation

- `REQ-226-001`: PASS — `recordRefundEvent` persists/locates the refund row and updates the derived order state in one database transaction; no active source path writes `paymentStatus: "refunded"` directly.
- `REQ-226-002`: PASS — payment webhook, refund webhook, customer cancellation, support cancellation, and finance execution use `recordRefundEvent` for refund event/status writes.
- `REQ-226-003`: PASS — `deriveOrderPaymentStatusFromRefunds` gives processed precedence, then pending, then failed; split-payment rows are aggregated.
- `REQ-226-004`: PARTIAL — gateway refund ID, refund ID, and payment ID identities are reused with unique-conflict retry, but no runtime concurrent database test is present.
- `REQ-226-005`: PASS — reconciliation scans both refunded-without-row and processed-row-with-non-refunded-status cases and returns report-only classifications.
- `REQ-226-006`: PARTIAL — the cron endpoint creates stable deduplicated operational alerts, but the implementation does not provide an automatic resolution event for a previously open mismatch.
- `REQ-226-007`: FAIL — the endpoint supports read-only querying of named order IDs, but no controlled environment evidence or issue-recorded outcome for Order 4 and `ORD-EAR-783631-QFJV` exists in the compared repository/Linear inputs.
- `REQ-226-008`: PARTIAL — existing downstream side effects remain in place and active refund paths are minimally changed, but full integration/regression evidence is unavailable and the cancellation helper’s invalid `"cancelled"` payment-status branch was corrected to `"failed"`.
- `REQ-226-009`: PASS — no schema change was needed: existing unique refund ID/payment ID boundaries are reused; Drizzle schema validation passes.
- `REQ-226-010`: PARTIAL — pure unit coverage is present; required database, webhook, authorization, and business-UAT evidence is not represented by dedicated REN-226 integration tests/artifacts.

## Scenario Reconciliation

- `SCN-226-001`: PASS by code path; runtime concurrency evidence remains part of `REV-226-002`.
- `SCN-226-002`: PASS — failed webhook records/locates the event and derives `refund_failed`.
- `SCN-226-003`: PASS by changed callers; full path execution evidence is absent.
- `SCN-226-004`: PARTIAL — bounded unique retry and identity lookup exist; no database concurrency test.
- `SCN-226-005`: PASS — order status aggregates distinct refund rows by order and does not use order ID as the event key.
- `SCN-226-006`: PASS — report classification detects missing backing rows without repair.
- `SCN-226-007`: PARTIAL — alert dedupe exists; resolution evidence is not implemented.
- `SCN-226-008`: FAIL — report input exists, but the two named case outcomes are not recorded.
- `SCN-226-009`: PASS by preserved signature/cron authorization boundaries; runtime authorization test is outstanding.
- `SCN-226-010`: PARTIAL — code preserves existing side effects, but repository-wide failures and absent focused integration coverage leave runtime regression evidence incomplete.
- `SCN-226-011`: PARTIAL — transaction/retry code supports safe recovery; no forced database failure or concurrent replay test is present.

## Invariant Reconciliation

- `INV-226-001`: PASS by transactional code; production data evidence is outstanding.
- `INV-226-002`: PARTIAL — identity lookup and unique-conflict retry protect normal replay, without a dedicated concurrent database proof.
- `INV-226-003`: PASS — active direct refunded status writes were removed from the inspected paths.
- `INV-226-004`: PASS — aggregate status uses all refund rows and event identity does not use order-only dedupe.
- `INV-226-005`: PASS — reconciliation returns classifications and emits alerts without updating financial rows.
- `INV-226-006`: PASS by inspection — webhook signature validation and cron secret authorization remain in place.
- `INV-226-007`: PASS by scope inspection — no payout/return redesign was introduced.
- `INV-226-008`: PARTIAL — transaction retry is present; side-effect and concurrent failure evidence remains incomplete.

## Flow and Architecture Review

- `FLOW-226-001`: PASS — `recordRefundEvent` is the shared persistence/status boundary and updates the refund/order records transactionally.
- `FLOW-226-002`: PASS by code inspection — signed refund webhooks persist before side effects; duplicate status transitions skip repeated webhook side effects.
- `FLOW-226-003`: PARTIAL — report and alert flow exists, but automatic resolution of cleared alerts is absent.
- `FLOW-226-004`: PASS by code structure — unique violation retries restart the transaction; gateway failures do not derive `refunded`.

The architecture matches the approved transaction-aware service/query design. Existing natural keys are reused without a migration. The main evidence gap is runtime database concurrency and production reconciliation, not an architectural contradiction.

## Security and Integration Review

- `SEC-226-001`: PASS — Razorpay signature verification remains before event parsing/state mutation in `src/app/api/webhooks/razorpay/refunds/route.ts`.
- `SEC-226-002`: PASS by boundary inspection — the new cron endpoint calls `requireCronSecret`; finance and existing protected routes retain their callers’ authorization.
- `SEC-226-003`: PASS — alert metadata contains order/refund identifiers and classifications, not gateway secrets.
- `INT-226-001`: PARTIAL — signed Razorpay processed/failed events are handled and replayed safely by code, but webhook integration tests are absent.
- `INT-226-002`: PARTIAL — payment/refund API callers now record through the canonical boundary; forced gateway/database failure recovery is not integration-tested.
- `INT-226-003`: PARTIAL — stable alert dedupe is implemented, but resolution behavior is not.
- `DEP-226-001` through `DEP-226-004`: PASS by changed query/route usage and preserved existing services.
- `DEP-226-005`: PARTIAL — the report accepts the named IDs, but no production/staging outcome is recorded.

## Scope and Drift Review

`NO_DRIFT`. The changed files are within the approved refund/order/webhook/finance/reconciliation scope. No migration, payout formula, return/RTO redesign, bulk backfill, Linear change, or production-data mutation was introduced. The payment-status correction in `cancel-order-helper.ts` replaces an invalid value outside the order status enum with the valid `failed` payment state required by the existing model; it does not add a new refund policy.

## Test Expectation Review

- `TEXP-226-001`: PARTIAL — pure state, identity, replay, split-payment, and classification tests exist; database-backed natural-key behavior is not tested.
- `TEXP-226-002`: PARTIAL — transaction code is present, but no database ordering/concurrency/failure integration test exists.
- `TEXP-226-003`: PARTIAL — callers are changed to the canonical method; no endpoint-level test proves every path.
- `TEXP-226-004`: PARTIAL — signature/cron guards remain by inspection; no dedicated REN-226 security test exists.
- `TEXP-226-005`: PARTIAL — downstream code remains, but full repository test results are not clean and no focused refund regression suite covers all consumers.
- `TEXP-226-006`: FAIL — no business-UAT artifact or issue-recorded named-order outcome exists.
- `TEXP-226-007`: PASS — no schema migration was required; Drizzle check passes.

## Findings

### REV-226-001

- Severity: BLOCKER
- Category: requirement
- Description: The two required historical gap cases have not been investigated and their outcomes are not recorded on REN-226.
- Evidence: `REQ-226-007`, `SCN-226-008`, `TEXP-226-006`; the implementation exposes `GET /api/cron/refund-reconciliation?orderId=...`, but no evidence for Order 4 or `ORD-EAR-783631-QFJV` is present in the compared commits or retrieved Linear issue.
- Impact: The production financial mismatch remains unclassified, so the issue’s acceptance criterion is not complete.
- Recommendation: Run the read-only reconciliation report in a controlled authorized environment for both IDs, record each outcome on REN-226, and obtain separate approval before any data correction.

### REV-226-002

- Severity: HIGH
- Category: test
- Description: The required database integration evidence for concurrent duplicate delivery, forced unique collision, transaction ordering, and failure recovery is missing.
- Evidence: `REQ-226-004`, `REQ-226-010`, `TEXP-226-002`; changed tests are pure unit tests under `src/lib/finance/*refund*.test.ts`, with no disposable-database or webhook integration test.
- Impact: The correctness of the transaction/retry boundary under actual Postgres concurrency is not proven.
- Recommendation: Add controlled integration tests for duplicate gateway delivery, unique conflict retry, split-payment aggregation, and rollback/failure behavior.

### REV-226-003

- Severity: MEDIUM
- Category: integration
- Description: Reconciliation creates stable alerts but does not automatically record resolution when a previously mismatched order becomes consistent.
- Evidence: `REQ-226-006`, `SCN-226-007`, `FLOW-226-003`; `runRefundReconciliation` calls `createOperationalAlert` for current mismatches but does not call the existing alert status update/resolution API for cleared dedupe keys.
- Impact: Operations may retain stale open mismatch alerts and lack a complete lifecycle trail.
- Recommendation: Add bounded resolution handling for this alert type, covered by an integration test.

## Decisions Requiring Attention

The approved historical-data decision `DEC-226-003` remains unresolved operationally by design: the implementation does not decide or mutate the two named records. No new design decision was introduced.

## Final Recommendation

Do not mark REN-226 fully production-complete yet. The source-of-truth implementation is structurally in place with no material drift, but the review remains failed until the two named cases have read-only outcomes recorded and database/concurrency evidence is added. Alert-resolution lifecycle hardening is also recommended.
