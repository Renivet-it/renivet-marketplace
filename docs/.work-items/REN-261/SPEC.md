# REN-261 — Bamboology brand catalogue ordering

## Scope

Change the default, unfiltered product order for `/brands/bamboology/shop` only.
The listing must keep every product and use the existing catalogue query's stable
fallback order for ties and unmapped records.

## Requirements

- Women products precede Men products; Men precede Home and Living; Home and Living precedes Beauty and Personal Care; unmapped/other categories follow.
- Within Women, Western Wear precedes Women Sports and Active Wear; remaining women subcategories follow, with Lingerie and Sleepwear last within Women.
- Within Men, Topwear precedes Men Sports and Active Wear; remaining men subcategories follow, with Innerwear and Sleepwear last within Men.
- The ordering is enabled only for the Bamboology brand's default catalogue view.
- Search, explicit sorting, category/subcategory/product-type filters, pagination, and non-Bamboology brand shops retain their current behavior.

## Design

Reuse the existing `prioritizedSubcategoryIds` query input and `CASE` ordering in
`productQueries.getProducts`. Build the priority list from cached category and
subcategory metadata so no database schema or data change is needed. The brand
page opts into the ordering by slug; the catalog layer applies it only when no
explicit shopper sort or search is active. Existing created-at ordering remains
the deterministic tie-breaker.

## Investigation and exclusions

Inspected the Bamboology brand route, `StorefrontCatalogPage`, the catalogue
query's ordering path, cached category/subcategory shapes, and existing
merchandising tests. Excluded product persistence, migrations, APIs, inventory,
checkout, analytics, and other brand routes because this is a presentation-order
change using existing product metadata and query filters.

## Risk

L1: contained, reversible storefront behavior with no schema, data, authorization,
payment, inventory, or external integration changes.

## Test expectations

- The ranking helper places category groups and the requested high-priority/last subcategories correctly while retaining all IDs.
- The Bamboology route opts into the ordering and other brand routes do not.
- Existing explicit-sort/search behavior remains covered by the current catalog path and a focused regression assertion.
