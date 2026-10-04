# REN-248 Engineering Specification

## Scope

**Linear:** REN-248 — Add more filters on dashboard for easy navigation  
**Branch:** `ayanganguly333/ren-248-add-more-filters-on-dashboard-for-easy-navigation`  
**Risk:** L1 — contained admin catalog filtering change using existing query paths

Add category, product type, and size-chart-presence filters to the existing general dashboard product table. Filters are URL-backed and composable with the existing search, brand, image, QC, visibility, festive, and table-column filters.

## Repository evidence

- `src/components/dashboard/general/products/products-review-table.tsx` already owns the general dashboard product table and persists existing filters through `nuqs`.
- `src/lib/trpc/routes/brands/products.ts` already accepts `categoryId`, `productTypeId`, and `sizes`.
- `src/lib/db/queries/product.ts` already applies category/product-type predicates and can inspect product options for size values.
- Existing product category, subcategory, and product-type query/cache helpers are available for option loading.
- No schema or migration is required.

## Design boundary

1. Add URL-backed `categoryId`, `productTypeId`, and `hasSizeChart` filter state to the general product table.
2. Load category and product-type options from existing read-only catalog sources; product type options follow the selected category where practical.
3. Define “size chart filter” as whether the product has one or more entries in its existing `sizeChartMedia` field. Preserve the unfiltered default and add a clear-all path.
4. Pass selected filters to the existing `getProducts` procedure. Multiple filters use the existing AND semantics.
5. Keep filters scoped to the dashboard table and preserve current pagination, search, brand, QC, visibility, festive, and column filtering behavior.

## Exclusions

Product creation/editing, storefront filters, schema changes, new permissions, production data changes, and changes to existing filter semantics are excluded.

## Required evidence before PR

- Unit/query coverage for the size-chart predicate and combined filter forwarding.
- Component coverage for URL state, option selection, multi-filter composition, and clear-all behavior where the repository’s test harness supports it.
- `bun test`, governance validation, and a production build/typecheck or equivalent available repository checks.
