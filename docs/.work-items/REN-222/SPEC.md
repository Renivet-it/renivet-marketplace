# REN-222 - Improve Product Slug Generation

## Scope

Change only future product creation. New slugs should use a readable
`brand-title` base and add a short deterministic disambiguator only when that
base already exists. Existing product slugs and URLs must not be rewritten.

The shared generator is used by the direct brand product-create flow, the
brand bulk/import flow, and `general/product-review.ts` bulk creation. All
active call sites must use the same collision-safe behavior. The database
already enforces uniqueness for `products.slug`.

## Required behavior

1. Base slugs contain normalized brand and product-title terms and no timestamp
   or random suffix.
2. A collision produces the first available short numeric suffix (`-2`, `-3`,
   and so on) from a bounded sequence; the legacy timestamp-plus-random format
   is not used for new products.
3. Existing rows, existing slugs, canonical URLs, redirects, and product
   lookup behavior are unchanged.
4. Direct, bulk/import, and product-review bulk creation handle collisions consistently.
5. Uniqueness remains safe under concurrent product creation. The indexed
   unique constraint remains the final authority, and a unique-conflict retry
   selects the next bounded suffix without rerunning unrelated side effects.
6. Empty/short bases and Unicode are handled by the existing slug normalization
   and validation rules; suffix exhaustion returns a safe validation error.

## Boundaries

- No migration, backfill, slug rewrite, or redirect project is authorized.
- No change to product search, display, sitemap semantics, or analytics.
- No removal or weakening of the unique `products.slug` constraint.
- Product creation authorization and brand ownership behavior remain unchanged.

## Acceptance evidence

- Unit coverage proves the clean base case and collision suffix behavior.
- Integration or route coverage proves both brand creation paths use the new
  generator and preserve authorization/data behavior.
- A regression check proves existing stored slugs are untouched.
- A concurrent or unique-constraint failure case proves no duplicate slug is
  persisted and the failure/retry outcome is deterministic.
- Bulk input with repeated bases has deterministic in-request suffix ordering.
- Full call-site search covers all three active creation paths.

## Rollback

Revert the generator and its call-site changes. No data rollback is needed
because this task does not modify existing rows or schema.
