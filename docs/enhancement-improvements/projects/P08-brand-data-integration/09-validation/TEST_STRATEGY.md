# Test Strategy — P08

## Primary test surface: the failure matrix

Every row in `08-reliability/FAILURE_MATRIX.md` and every acceptance criterion in `03-requirements/ACCEPTANCE_CRITERIA.md` is a required test case, not an optional one — this is the research's own POC success bar (`16-final/POC_PLAN.md`): POC succeeds if it demonstrably closes F4 (no provenance) and F7 (no per-row detail/history) for the File-First path, exercised against all 10 named failure scenarios.

## Test layers

1. **Unit**: schema-mapping deterministic matcher (alias dictionary), attribute-normalization lookup logic, exact-match identity resolver, validation rules (range/type/cross-field).
2. **Integration**: full pipeline (upload → parse → map → normalize → resolve → validate → dry-run → approve → write → log) against representative fixture files covering each failure scenario in the matrix.
3. **Security regression (mandatory, tied to F10)**: an automated test asserting cross-brand rejection for each of the 6 Unicommerce brand-settings procedures (AC-31) — brand-admin A calling with brand B's `brandId` must be rejected. This test must exist before the F10 fix is considered done, not as a follow-up.
4. **AI-assist gate tests**: assert that no write occurs for any fuzzy/AI-ranked identity candidate without an explicit human-confirmation step in the test harness (enforcing BRule-1 at the test level, not just by code review) — this is the test-level enforcement of the corrected Tier 2 decision (`05-algorithms/DECISION_LOGIC.md`).
5. **Retry/idempotency**: retry a partially-failed batch fixture and assert no duplicate writes (AC-30).

## Explicitly not in V1's test scope

Load/performance testing against unmeasured production volume (no target exists to test against — `08-reliability/PERFORMANCE.md`); reconciliation/drift-detection testing (Phase 2, no component exists to test); SKU-matching auto-apply precision/recall testing (Phase 2/V3, depends on real match data that doesn't exist yet, see `05-algorithms/ALGORITHM_EVALUATION.md`).

## Test data

No production brand data should be used for fixture files without existing data-handling approval; representative synthetic fixtures per persona (Priya/Rahul/Ananya shapes) are sufficient for V1 test coverage, since the personas themselves are explicitly illustrative, not real-brand-derived (`02-business-customer/PERSONAS.md`).
