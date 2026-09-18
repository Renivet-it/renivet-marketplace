# REVIEW: REN-229 — [FCCP] Commission Rules Data Integrity / Foundation

## Executive Result

Result: `REVIEW_FAILED` with `MATERIAL_DRIFT`. The schema and migration implementation matches the approved FK, index, date-range, wildcard, and database-level overlap design, but the required database integration and recovery evidence is not present. Governance re-entry is required before this work can be considered complete.

Comparison: `main` at `58a5a2b2d236449d788e0f26a988d1eadb6e2591` to `feat/ren-229-spec` at `46913c94e5178bdf87ad54076678847d5dc2b045`. PR: https://github.com/Renivet-it/renivet-marketplace/pull/666.

## Review Scope and Git Evidence

The approved Linear issue REN-229, its approved `SPEC.md`, `CRITIQUE.md`, and `work-item.yaml` were reconciled against the base-to-head diff. Changed implementation paths are `drizzle/0285_commission_rules_integrity.sql`, `drizzle/meta/_journal.json`, `src/lib/db/schema/finance-compliance.ts`, and `tests/ren-229-commission-rules-integrity.test.ts`. Governance artifacts are also present under this task directory. The worktree was clean at the recorded head commit.

## Requirement Reconciliation

- `REQ-229-001`: PASS — the migration adds named nullable-safe FKs for brand, category, and product type with `ON DELETE RESTRICT`; the Drizzle model mirrors them.
- `REQ-229-002`: PASS — named brand and priority indexes are emitted and declared in the model.
- `REQ-229-003`: PASS for implementation design — the active exact-scope exclusion constraint uses `COALESCE` sentinels and inclusive/open-ended `daterange` semantics.
- `REQ-229-004`: PASS — the migration is additive, contains no rule inserts, and does not touch payout calculation or category rates.
- `REQ-229-005`: FAIL — the repository contains only static contract assertions; required DB integration, rollback, concurrency, and regression evidence is absent.
- `REQ-229-006`: PASS — the model and emitted migration contain the selected FKs, indexes, and invalid-range check.
- `REQ-229-007`: PASS — invalid date ordering is rejected by the named check and inclusive/open-ended behavior is encoded in the exclusion constraint.
- `REQ-229-008`: PARTIAL — the migration is journal-registered and guarded for rerun, but transaction/partial-failure recovery is documented only as comments and lacks executable evidence.

## Scenario Reconciliation

- `SCN-229-001`: PARTIAL — FK definitions are present, but all three invalid-reference cases are not exercised against PostgreSQL.
- `SCN-229-002`: PARTIAL — overlap behavior is encoded, but boundary and non-overlap cases are not exercised against PostgreSQL.
- `SCN-229-003`: PARTIAL — inactive and NULL-brand behavior is encoded, but not integration-tested.
- `SCN-229-004`: PARTIAL — additive SQL and rollback comments are present, without executable migration/rollback verification.
- `SCN-229-005`: PASS by diff scope — no commission rows or payout logic are changed.
- `SCN-229-006`: PARTIAL — valid references and date semantics are encoded, without DB execution coverage.
- `SCN-229-007`: FAIL — no executable concurrent-write or partial-failure recovery evidence was found.

## Invariant Reconciliation

- `INV-229-001` through `INV-229-006`: PASS by migration/model evidence.
- `INV-229-007`: PARTIAL — the PostgreSQL exclusion constraint is atomic by design, but concurrent conflicting writes are not tested in the repository.

## Flow and Architecture Review

`FLOW-229-001` and `FLOW-229-002` are implemented by the journaled migration and database constraints. `FLOW-229-003` is documented through the manual rollback block. `FLOW-229-004` is only partially evidenced: idempotent guards are present, but migration transaction and recovery behavior are not executable tests. No application API, resolver, payout, or rule-population path was changed.

## Security and Integration Review

`SEC-229-001` is compatible with the diff: no credentials, customer data, or production writes are introduced. `INT-229-001` is partially satisfied: the migration is registered and rerun guards exist, but PostgreSQL migration failure/recovery and concurrent constraint behavior require integration evidence.

## Scope and Drift Review

The implementation stays within the approved schema/data-integrity scope. The material drift is in required delivery evidence, not in the selected FK or overlap semantics: `TEXP-229-001` through `TEXP-229-007` require executable integration/regression/recovery coverage, while the added test file performs static source checks only.

## Test Expectation Review

- `TEXP-229-001`: PARTIAL — static FK assertions exist; DB violation/valid-reference tests do not.
- `TEXP-229-002`: PARTIAL — static exclusion assertions exist; overlap, boundaries, inactive, wildcard, and concurrency tests do not.
- `TEXP-229-003`: PARTIAL — static scope/no-insert checks exist; live metadata/zero-row/resolver regression evidence is absent.
- `TEXP-229-004`: PARTIAL — no sensitive data is introduced, but authorized migration-path verification is not executable here.
- `TEXP-229-005`: PARTIAL — rollback is documented, not executed or verified.
- `TEXP-229-006`: PARTIAL — date/FK semantics are statically encoded, not run against PostgreSQL.
- `TEXP-229-007`: FAIL — no executable concurrent-write or partial-failure recovery test was found.

## Findings

### REV-001

- Severity: BLOCKER
- Category: test
- Description: Required PostgreSQL integration and recovery coverage is missing; `tests/ren-229-commission-rules-integrity.test.ts` only checks source text.
- Evidence: `REQ-229-005`, `REQ-229-008`, `TEXP-229-001` through `TEXP-229-007`; `tests/ren-229-commission-rules-integrity.test.ts`.
- Impact: The branch cannot prove that PostgreSQL accepts valid wildcard/non-overlapping rules, rejects invalid references/ranges/overlaps, protects concurrent writers, or recovers safely from migration failure.
- Recommendation: Add repository-compatible database integration tests covering all required FK, range, overlap, inactive/wildcard, concurrency, migration rerun, rollback, and regression cases; rerun the review afterward.

## Decisions Requiring Attention

None. The approved `DEC-229-001` and `DEC-229-002` decisions are implemented consistently.

## Final Recommendation

Do not mark REN-229 complete or merge PR #666 yet. Add the missing executable database integration/recovery coverage, rerun governance validation and this review, and retain the approved contract unchanged.
