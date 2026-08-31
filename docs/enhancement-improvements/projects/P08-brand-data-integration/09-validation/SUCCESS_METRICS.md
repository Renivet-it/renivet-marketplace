# Success Metrics — P08

## V1 (POC-equivalent) success bar, reused directly from research

Per `16-final/POC_PLAN.md`: **V1 succeeds if it demonstrably closes F4 (no provenance) and F7 (no per-row failure detail, no history) for the File-First path it builds** — it is explicitly NOT judged on brand-tier coverage breadth (that is a gated Phase 2 question, dependent on the still-UNKNOWN brand-tier distribution).

## Concrete V1 metrics

- 100% of File-First writes carry `source`/`sourceRecordedAt` provenance (FR-14) — binary, verifiable by query.
- 100% of import batches produce a queryable per-batch log with per-row outcome (FR-15) — binary, verifiable by query.
- Zero silently-discarded unmatched rows — every unmatched row is present in the held/queued state, verifiable against upload row counts (FR-10).
- Zero cross-brand data exposure across the 6 previously-vulnerable Unicommerce procedures — verified by the mandatory regression test (AC-31), not merely code review.
- All 10 named failure scenarios (`08-reliability/FAILURE_MATRIX.md`) have a passing, isolated test case.

## Business-facing metrics (directional, not independently researched targets)

- Reduction in brand-side onboarding/update effort for spreadsheet-only brands (Priya persona) — no specific target number exists in research; this is a qualitative goal the plain-language-error and mapping-memory requirements serve (USER_STORIES.md).
- Reduction in engineering-escalation volume for brand data issues — depends on the still-unresolved staffing/ownership decision (`07-feasibility/RESOURCE_ASSESSMENT.md`); cannot be measured until that decision is made and a review-queue owner exists to measure against.

## What is explicitly NOT a V1 metric

Match-precision/recall for fuzzy SKU matching — no auto-apply path exists in V1 to measure (see `05-algorithms/ALGORITHM_EVALUATION.md`); this becomes a real metric only once V1's logging has generated enough real data to evaluate against, which is itself a Phase 2/V3 activity, not a V1 deliverable.

## Metric ownership

No metric owner is currently named — this traces to the same staffing/ownership gap flagged throughout (`07-feasibility/RESOURCE_ASSESSMENT.md`, `99-final/OPEN_DECISIONS.md`). Metrics above are measurable by engineering via direct query even without a dedicated ops owner; the business-facing metrics require that owner to be meaningful over time.
