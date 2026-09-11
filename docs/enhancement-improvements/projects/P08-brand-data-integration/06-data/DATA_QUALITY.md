# Data Quality — P08

## Validation layers (ordered, per `06-sync-and-reconciliation/` Validation)

1. **Structural/type**: does the value parse as the expected type (number, date, enum member)?
2. **Referential integrity against `brandId`**: does this row target the uploading brand's own data, never another brand's (this is explicitly named in the research as a cross-tenant leak risk, not merely "a bad row" — see `08-reliability/SECURITY.md`).
3. **Sane value ranges**: reject negative quantity/price outright; implausible-jump detection (e.g., >500% quantity change) needs prior-value history, which V1's `import_records`/provenance pair provides for File-First rows going forward (it did not exist before this Epic).
4. **Cross-field consistency**: e.g., `compareAtPrice` should not be nonsensically lower than `price` without an explicit sale flag (implementation detail, not further specified by research).

Every validation failure is counted, categorized, and persisted per-row (`import_records.error_detail`) — never silently dropped, unlike today's `missingSkus` behavior.

## Known current-state data-quality failure patterns this Epic must not repeat

- **Silent column mismatch**: today's XLSX importer degrades to empty/undefined on any header mismatch with no error. V1's schema-mapping layer must surface, not silently absorb, this case (FR-8).
- **Silent SKU loss**: today's `missingSkus` array is discarded after a one-shot toast. V1 persists every unmatched row to a reviewable queue (FR-10).
- **Variant vocabulary fragmentation**: `productOptions` values are free-text per-product with no shared vocabulary — "M" vs. "Medium" vs. "M " can silently fragment across a bulk import unless the ingestion-time normalization/lookup-table step catches it (FR-7; Research: `07-catalog-and-media/`).
- **Media/variant asymmetry**: `productVariants.image`'s raw-URL bypass of `brandMediaItems` is a known inconsistency; V1 does not replicate this pattern for new File-First writes (Research: F4).

## Schema-drift-as-a-data-quality signal

Value-format drift (as opposed to structural column drift) is detected via a spike in the normalization layer's "unmapped value" rate per brand/connector/field over time — this is the one place V1's design anticipates a light monitoring signal, though building a dashboard around it is explicitly Phase 2 (`05-algorithms/ALGORITHM_EVALUATION.md`).

## AI feasibility for data-quality tasks specifically

`08-ai-opportunities/AI_USE_CASES.md` scores "data-quality error summaries" (batch-level plain-language summaries of what went wrong across a large failed import) as GREENLIGHT but low priority — a genuine, narrow use for AI (summarization of already-deterministically-detected errors), not a detector. Not built in V1; the per-row `error_detail` contract (`06-data/DATA_CONTRACTS.md`) is sufficient for V1's scale and the AI summary layer is deferred as a UX enhancement, not a data-quality requirement.

## Category/taxonomy data quality

Because `categoryId`/`subcategoryId`/`productTypeId` are enforced FK/NOT NULL against Renivet's existing taxonomy, a brand's raw category string must resolve via an explicit per-brand/source category-mapping step (built once per source, reused thereafter) — never create-on-the-fly. Unmapped source categories block only the affected rows, not the whole batch. (Research: `07-catalog-and-media/`.)
