# REVIEW: REN-209 — [FCCP][P1] Establish Brand Commercial Configuration Control

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`. The implementation is within the approved Terra Luna-only, provisional, zero-holdback contract. Drift is `NO_DRIFT`; governance re-entry is not required.

## Review Scope and Git Evidence

- Base branch: `origin/master`
- Comparison base: `a015f3b5cdd4b89dd8f0c6d7475313d722d6af14`
- Head: `4e452e938d107388d05887f32e52c0aeb59f5fb9`
- PR URL: `null`
- Changed paths: REN-209 governance artifacts, `0288_ren209_terra_luna_commercial_rules.sql`, Drizzle journal, finance tRPC rule access/write validation, and focused tests.

## Requirement Reconciliation

- `REQ-209-001`, `REQ-209-002`, `REQ-209-004`, `REQ-209-005`, `REQ-209-006`, `REQ-209-007`, and `REQ-209-008`: PASS by the additive seed, admin-only route, metadata source/approver fields, forced zero holdback, and existing audit call.
- `REQ-209-003`: PASS by preserving the resolver’s no-rule path and avoiding any non-Terra seed.

## Scenario Reconciliation

- `SCN-209-001` through `SCN-209-006`: PARTIAL. Static tests cover the migration and route contract; live database lifecycle, authorization, audit, and supersession behavior are not exercised here.

## Invariant Reconciliation

- `INV-209-001`, `INV-209-002`, `INV-209-003`, `INV-209-004`, and `INV-209-005`: PASS by the migration metadata, zero holdback enforcement, admin-only route, and unchanged payout resolver boundary.

## Flow and Architecture Review

- `FLOW-209-001` and `FLOW-209-003`: PARTIAL. The existing upsert endpoint supports later edits and audit writes, but no new dedicated visual admin page was added.
- `FLOW-209-002`: PASS by the existing resolver’s explicit null-rule path and the absence of fallback seeding.
- `DEP-209-001` through `DEP-209-004`: PASS; `commission_rules` and its metadata remain the source of truth.

## Security and Integration Review

- `SEC-209-001` and `SEC-209-002`: PASS. Commission rule listing is now admin-only and writes use `adminProcedure` plus finance manage authorization.
- `INT-209-001` and `INT-209-002`: PARTIAL. Migration and audit integration are statically visible, but PostgreSQL rollback, failure, and audit persistence are not runtime-tested.

## Scope and Drift Review

`NO_DRIFT`. The migration populates only Terra Luna, stores 25% Fashion/Clothing and 20% Personal Care, sets holdback to zero, and does not touch existing contract timestamps or payout arithmetic.

## Test Expectation Review

- `TEXP-209-001` and `TEXP-209-004`: PASS by existing commission tests and focused REN-209 assertions.
- `TEXP-209-002`, `TEXP-209-003`, and `TEXP-209-005`: PARTIAL because live database, authorization matrix, audit persistence, and failure recovery tests are not included.

## Findings

### REV-001

- Severity: MEDIUM
- Category: test
- Description: Runtime integration coverage for Terra Luna resolution, admin/brand authorization, audit persistence, migration failure, and supersession is still missing.
- Evidence: `TEXP-209-002`, `TEXP-209-003`, `TEXP-209-005`; current test coverage is `tests/ren-209-commercial-configuration.test.ts` plus existing commission unit tests.
- Impact: The static contract is verified, but production database behavior and role boundaries require runtime confirmation.
- Recommendation: Add the approved PostgreSQL and authorization integration matrix before production rollout.

### REV-002

- Severity: LOW
- Category: architecture
- Description: The existing finance tRPC route provides the editable admin API, but this diff does not add a dedicated visual configuration page.
- Evidence: `src/lib/trpc/routes/general/finance.ts` exposes `listCommissionRules` and `upsertCommissionRule`; no new dashboard component is included in the REN-209 diff.
- Impact: An operator needs an existing/consumer UI or API client to edit the values later.
- Recommendation: Add a finance admin page if a self-service UI is required; the server control remains admin-only.

## Decisions Requiring Attention

None. The provisional values, approver Akshay, and temporary no-source-document status were confirmed by the user.

## Final Recommendation

Accept the implementation for review. Apply migration `0288_ren209_terra_luna_commercial_rules.sql`, then verify that the deployed category names resolve to the intended Fashion/Clothing and Personal Care categories. Complete `REV-001` before relying on the configuration for payout operations.
