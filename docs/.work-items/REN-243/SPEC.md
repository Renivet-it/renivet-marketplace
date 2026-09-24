# REN-243 — Bulk HSN update reliability and admin import

## Goal

Ensure product bulk uploads persist HSN codes for existing products and variants, and provide an authorized admin workflow for safely importing HSN values by SKU with validation, preview, progress, and an auditable result.

## Repository evidence

- The supplied CSV has 6,562 parsed rows, 6,562 unique non-empty SKUs, 6,562 non-empty `HS Code` values, and no duplicate/conflicting SKU rows.
- `product-add-admin.tsx` maps `HS Code` into both product and variant input objects.
- `product-review.ts` and `brands/products.ts` include `hsCode` when updating an existing product.
- Both bulk routes omit `hsCode` when updating an existing variant; they only persist it when inserting a new variant. This is the confirmed root cause for existing variant HSN values not changing.
- Product and variant records store HSN as `hsCode`; the HSN master is a separate reference table and is not the product update target.
- Existing admin HSN master import is limited to HSN master rows and is not a product-by-SKU updater.

## Scope and design

- Preserve the existing bulk product upload contract and add `hsCode` to existing-variant update payloads in both general-admin and brand bulk paths.
- Add an admin-only product HSN import under the existing general settings pattern. Accept CSV and XLSX with a required SKU column and an HSN/HS Code column.
- Parse and validate server-side. Never create products or variants from this workflow.
- Resolve an input SKU against canonical product SKU and variant SKU values. If exactly one record matches, update that record's `hsCode`; if a SKU matches both product and variant or multiple records, report an ambiguity and do not update it.
- Use a two-step preview/apply flow. Preview performs no writes. Apply requires an explicit confirmation token derived from the preview and revalidates the uploaded content before writing.
- Process bounded batches with progress counts and per-row outcomes. A failed row is reported without being silently counted as updated. The result includes updated, unchanged, skipped, unmatched, ambiguous/conflicting, invalid, and failed counts plus downloadable row-level errors.
- Default to skipping blank HSN cells; they never clear an existing HSN in this import. Invalid HSN values are reported. Existing duplicate-SKU rejection behavior in the product bulk upload remains unchanged; the dedicated HSN import also rejects duplicate input SKUs rather than selecting a row.
- Treat the database as authoritative. No production data is changed by the supplied CSV during development, testing, or deployment.
- Keep the operation idempotent: reapplying the same SKU/HSN mapping is reported unchanged and does not create duplicate records.
- Reuse existing auth, settings, CSV/XLSX parsing, audit, and toast/progress UI patterns. No new schema or migration is needed unless repository evidence proves an audit/result store is required; otherwise audit the run summary using existing audit facilities.

## Explicit exclusions

- No HSN master creation or GST-rate inference.
- No product creation, SKU rewriting, variant restructuring, production backfill, or deployment.
- No change to invoice/tax calculation rules.
- No unrelated bulk-upload refactor.

## Required test evidence

- Unit tests for header normalization, HSN validation, blank handling, duplicate/conflict detection, matching precedence/ambiguity, batch progress, and idempotent outcomes.
- API tests for authorization, preview-without-write, apply confirmation, revalidation, bounded batches, partial row failures, and stable result counts.
- Regression tests proving both existing product and existing variant bulk uploads persist `hsCode`.
- Component tests for file type/size validation, preview summary, explicit apply confirmation, progress, and downloadable failures.
