# REN-235 Engineering Specification

## Objective

Provide an admin-only, preview-first discount import workflow for product and variant SKUs. Each imported row is matched against both `products.sku`/`products.nativeSku` and `product_variants.sku`/`product_variants.nativeSku`. Before any write, the operator sees the current price, imported discount, calculated discounted price, compare-at price, and exact match target.

The approved pricing behavior is: use the current selling price as the discount basis, preserve that current price as `compareAtPrice`, and write the rounded discounted result as the new selling price.

## Scope

- Accept CSV and XLSX imports using the existing product-import parsing conventions.
- Match SKU as the primary identifier; EAN/barcode fallback is optional and must be explicit.
- Detect product-only, variant-only, duplicate, ambiguous, missing, inactive, and invalid rows.
- Preview all accepted and rejected rows before mutation.
- Apply confirmed changes in retry-safe backend batches.
- Record an import audit with before/after prices and support rollback of the latest import.

## Non-goals

- No automatic production write immediately after upload.
- No silent EAN fallback when SKU is present but unmatched.
- No changes to inventory, product descriptions, variant options, or order discounts.
- No overwrite of ambiguous or duplicate SKU matches.

## Operator flow

1. Admin uploads a discount file.
2. Backend parses and normalizes rows.
3. Backend returns a preview grouped by matched product, matched variant, duplicate, unmatched, invalid, and unchanged.
4. UI displays current price, discount percentage, calculated new price, compare-at price, SKU, target type, and validation status.
5. Admin explicitly confirms only valid rows.
6. Backend creates an idempotent import job and applies updates in batches.
7. UI reports progress, failures, and a downloadable error result.
8. Admin can roll back the latest completed import.

## Admin location

Add a new **Product Discounts** menu item under **Dashboard -> General -> Platform Settings**. The page is restricted to authorized catalog/finance administrators and contains the upload control, preview table, apply action, progress state, import history, error download, and rollback action.

## Price calculation

For current price `P` and discount fraction `D` (for example `0.45`), calculate:

`discountedPrice = round(P * (1 - D))`

Before writing, preserve the current price as compare-at price. The stored unit remains paise/integer. The preview must show both rupee display values and exact stored integer values.

## Required behavior

- Product and variant matches are both checked for every SKU.
- A SKU matching both a product and a variant is ambiguous and cannot be applied without explicit resolution.
- Duplicate input rows with conflicting discounts are blocked.
- Repeating the same import does not create a second mutation or change the result again.
- Partial batch failure leaves successful rows recorded and failed rows retryable.
- Every mutation is attributable to an admin, import ID, source filename/hash, timestamp, old value, and new value.
- Rollback restores only values changed by the selected import and refuses to overwrite later changes without an explicit conflict report.

## Security and safety

- Admin/finance authorization is required for preview and apply; only authorized operators can apply or roll back.
- Production writes happen only after explicit confirmation of the preview.
- File size, row count, percentage range, numeric precision, and malformed-row limits are enforced.
- Raw uploaded files and audit data must not expose unrelated customer or payment data.

## Validation evidence from supplied files

- Terra Luna CSV: 6,562 rows.
- Discount workbook: 9,613 rows.
- Exact SKU/product-code overlap: 6,552 rows.
- CSV SKUs without workbook matches: 10.
- Workbook codes absent from CSV: 3,061.
- Workbook product-code duplicates exist and must be blocked or resolved before apply.

## Test plan

- Unit: percentage normalization, rounding, zero discount, maximum discount, and invalid values.
- Unit: product SKU match, variant SKU match, native SKU match, ambiguous product/variant match, and no match.
- Unit: duplicate rows with same and conflicting discounts.
- Integration: preview produces no database writes.
- Integration: confirmed apply updates product and variant prices and compare-at values correctly.
- Integration: retrying the same import is idempotent.
- Integration: partial batch failure is retryable without duplicate updates.
- Integration: rollback restores the import's before-values and reports later-change conflicts.
- UI: preview totals, row-level status, current/new price, confirmation, progress, and error download.
- Security: unauthorized users cannot preview sensitive catalog data or apply/rollback imports.
