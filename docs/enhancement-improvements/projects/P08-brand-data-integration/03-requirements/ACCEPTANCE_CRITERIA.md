# Acceptance Criteria — P08 (V1)

Organized by the functional requirement each criterion validates. These reuse the research's own POC failure-scenario list (`16-final/POC_PLAN.md`) as the acceptance bar — the research explicitly defines POC success as closing F4 (no provenance) and F7 (no per-row failure detail, no history) for the one ingestion path built, not breadth of brand-tier coverage.

## Ingestion (FR-1 to FR-3)

- AC-1: Given a brand uploads a file via the extended importer, the file is parsed and routed through the shared write path, not a standalone disconnected tool.
- AC-2: Given the `xlsx` dependency is upgraded, the importer functions against the same file formats it currently accepts.

## Schema/value mapping (FR-4 to FR-8)

- AC-3: Given a column exactly matches the alias dictionary (post-normalization), it is mapped deterministically with no AI call.
- AC-4: Given a column has no deterministic match, an AI-suggested mapping is presented and the import cannot proceed on that column until a human confirms or corrects it.
- AC-5: Given a mapping was confirmed on a prior upload from the same brand, a subsequent upload reuses it without re-prompting, unless schema drift is detected.
- AC-6: Given a previously-mapped column disappears from a new upload, the sync hard-fails with a clear message rather than writing nulls.
- AC-7: Given a new, previously-unseen column appears, it is flagged "unmapped, ignored" and surfaced for review, not silently dropped or silently mapped.
- AC-8: Given a batch contains multiple rows with the same raw attribute value (e.g., "M"), the value is deduplicated once per batch before any AI call, resolved against the brand's own lookup table.

## Identity resolution (FR-9 to FR-11)

- AC-9: Given a row's SKU exactly matches an existing variant's `sku` (brand-scoped), it resolves automatically with no human step.
- AC-10: Given a row has no exact match, it is placed in a persisted, reviewable queue — never discarded, never auto-matched.
- AC-11: Given the system presents a fuzzy/AI-ranked candidate for a held row, no write occurs against that row until a human explicitly confirms the candidate.
- AC-12: Given two variants of the same product differ only by size/color, an ambiguous row is never auto-resolved to either variant.

## Validation and dry run (FR-12, FR-13)

- AC-13: Given a row has a negative price or quantity, it is rejected and surfaced, not coerced to zero or silently accepted.
- AC-14: Given a row targets a `brandId` other than the uploading brand's own, it is rejected — this must be provably impossible via the validation layer, not merely untested.
- AC-15: Given a batch is validated, the brand sees a diff (matched/unchanged/changed/new/removed/ambiguous/invalid counts) before approving the write.
- AC-16: Given a brand does not explicitly approve the dry-run diff, no write occurs.

## Write and provenance (FR-14 to FR-16)

- AC-17: Given a File-First write occurs, the affected row(s) carry a `source` value identifying the import path and a `sourceRecordedAt` timestamp.
- AC-18: Given a batch completes (fully or partially), a per-batch log records the file, brand, per-row succeeded/failed outcome, timestamp, and resulting row IDs.
- AC-19: Given a batch partially fails, succeeded rows are committed and failed rows are individually reported — the batch is not all-or-nothing.
- AC-20: Given a partially-failed batch is retried, previously-succeeded rows are not re-written or duplicated.

## Failure scenarios (must all be exercised, per `16-final/POC_PLAN.md`)

- AC-21: Malformed/corrupt file is rejected with a clear error, no partial silent parse.
- AC-22: A row missing a required field is rejected individually, not the whole batch.
- AC-23: An ambiguous column (no confident schema match) is surfaced for human resolution, never auto-resolved.
- AC-24: An unknown SKU is held, never guessed.
- AC-25: A duplicate SKU within one file is detected and surfaced, not silently overwritten twice.
- AC-26: Schema drift (missing/renamed/retyped column vs. a prior upload) is detected and surfaced, not silently absorbed.
- AC-27: An invalid stock value (negative, non-numeric, absurd magnitude) is rejected.
- AC-28: A missing or misassociated image is surfaced, not silently linked to the wrong variant.
- AC-29: A partial failure produces per-row results.
- AC-30: A retry of a partially-failed batch does not double-write.

## Security (FR-17)

- AC-31: Given brand-admin A calls any of the 6 Unicommerce brand-settings procedures with `input.brandId` set to brand B, the call is rejected — verified by an automated test asserting cross-brand rejection for each of the 6 procedures.
