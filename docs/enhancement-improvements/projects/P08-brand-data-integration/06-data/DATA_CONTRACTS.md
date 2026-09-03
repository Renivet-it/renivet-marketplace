# Data Contracts — P08

## Canonical target fields for schema mapping

Per `05-identity-and-mapping/SCHEMA_MAPPING.md`, the canonical target field list a brand's source columns map onto: `title`, `description`, `sku`, `barcode`, `price` / `compareAtPrice` / `costPerItem`, `quantity`, `weight` / `length` / `width` / `height` (with units), `originCountry`, `hsCode`, variant options/values (`productOptions.values` jsonb, `productVariants.combinations` jsonb), and category/subcategory/productType (resolved against Renivet's existing taxonomy FKs — a brand's raw category string is never used to create a new taxonomy entry on the fly; unmapped source categories block only the affected rows).

## Import-batch contract (see `06-data/DATA_REQUIREMENTS.md` Option B)

`import_batches`: `id`, `brand_id`, `source` (enum, extends `inventorySource`: `manual` / `unicommerce` / `order_adjustment` / **`file_import`**), `file_reference`, `uploaded_by`, `status` (`uploaded` / `mapping` / `validating` / `awaiting_approval` / `approved` / `writing` / `written` / `partially_failed` / `cancelled`), `created_at`, `completed_at`.

`import_records`: `id`, `batch_id`, `raw_row` (jsonb, as-uploaded), `mapped_row` (jsonb, post schema-map/normalize), `status` (`pending` / `held_mapping` / `held_normalization` / `held_identity` / `queued_candidate` / `validated` / `failed_validation` / `written` / `failed_write`), `error_detail` (nullable, plain-language + structured code, reusing the existing `productQcFindings` error shape: `code`, `severity`, `field`, `title`, `description`, `suggestion` — per `07-catalog-and-media/` recommendation, not a new error shape), `resolved_variant_id` (nullable, set once identity resolves), `source` / `source_recorded_at` (the provenance pair actually written to canonical tables on success).

## Provenance contract

Every canonical row (`products`, `productVariants`, price fields, media associations) written or updated via File-First carries `source = 'file_import'` and `source_recorded_at = <write timestamp>`, generalizing the existing `inventorySource`/`inventoryLastSyncedAt` pattern (F4) to variant/price/media scope. This is a hard contract — FR-14 states no File-First write path exists without it.

## Identity contract (V1, exact-match only)

A row resolves to an existing `productVariants` row if and only if one of: `sku` exact match (brand-scoped), `barcode` exact match (brand-scoped), or normalized-title + full variant-attribute exact match. No other resolution path writes in V1. Rows that don't resolve are held (`import_records.status = 'held_identity'`), never written under a guessed identity (BRule-1).

## AI-assist audit contract

Every AI-assisted decision (schema-mapping suggestion, attribute-normalization resolution, SKU candidate ranking) logs: input, output, confidence, tier, action taken, and the human-decision link — satisfying NFR-7. This log is a queryable table, not embedded solely in `import_records.mapped_row`, since it needs to persist even for records that never reach a terminal `import_records` state (e.g., an abandoned batch).

## What is explicitly NOT part of the V1 data contract

- No `brand_external_identifiers` multi-source identity table (Phase 2, gated on a brand having two concurrent live sources).
- No append-only historical inventory log beyond what `import_records` provides per-batch (Phase 2, tied to the reconciliation spine — see `06-data/DATA_REQUIREMENTS.md` Option C/D).
- No multi-warehouse/location schema beyond the existing nullable future-proofing column.

## Contract stability note

Per BRule-3, a confirmed schema mapping (brand's column → canonical field) is versioned, not overwritten, when schema drift triggers a re-mapping — this applies to whatever table stores confirmed mappings (a `brand_schema_mappings` table, one row per brand+canonical-field+effective-date), which V1 must include as part of implementing FR-6/FR-8, even though it isn't listed as its own file in the template.
