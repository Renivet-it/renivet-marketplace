# REN-159 — Cache category-only and category+sort catalog listing views

## Status

`IN_REVIEW` — specification prepared; explicit owner approval is pending.

## Objective

Reduce repeated database load for the public `/shop` catalog when shoppers request a bounded category listing either with the default order or with an allowed shopper sort. Preserve current results, filter semantics, personalization, and the existing 60-second cache behavior.

## Repository findings

- `src/components/shop/storefront-catalog-page.tsx` currently uses `unstable_cache` only for the unfiltered page-1 default view and the unfiltered page-1 new-arrivals view.
- All other public catalog requests fall through to `productQueries.getProducts`, including category selections and category-plus-sort selections.
- `getProducts` applies many query-affecting inputs: category, subcategory, product type, brand, search, price, color, size, discount, pagination, ordering, curated scope, and recommendation priorities.
- The public storefront supplies approved/active/available/not-deleted predicates and requires product media.
- The existing cache TTL is 60 seconds and the issue requests the same expiry pattern.
- `getStorefrontFilterData` computes filter metadata separately; this task must not cache or alter those counts unless the implementation proves their key and freshness contract is equivalent.

## Scope

Implement a bounded read-through cache for public catalog listing results when all of the following are true:

1. The request is page 1 with the standard storefront limit of 28.
2. It has exactly one category constraint (`categoryId`).
3. It has no free-text search, brand, subcategory, product type, color, size, price, discount, curated, personalized, or other arbitrary filter constraint.
4. It uses the storefront’s public product predicates and media requirement.
5. It uses either the default/recommended ordering or one of the supported category sort shapes (`price` with `asc`/`desc`, or `createdAt` with `asc`/`desc`) as represented by the current normalized storefront parameters.

The cache key must include every input that can change the returned listing, at minimum category ID, normalized sort field/order, page, limit, and the cache contract version. Key construction must use a stable allowlisted representation, not raw query-string order.

## Out of scope

- Arbitrary free-text or semantic search requests.
- Price ranges, discount ranges, colors, sizes, brands, subcategories, product types, curated lists, and personalized recommendation results.
- Filter metadata/count caching or changes to left-panel filter semantics.
- Database schema, migrations, product mutation invalidation, or changes to product visibility rules.
- Changing the existing 60-second TTL or introducing a new cache provider.

## Functional requirements

- `REQ-159-001`: Identical eligible category-only requests return the same result shape and use the same cache entry within 60 seconds.
- `REQ-159-002`: Eligible category-plus-sort requests use distinct stable keys for each supported sort field and direction, and never collide with category-only or another sort variant.
- `REQ-159-003`: The cache includes all result-affecting scope/ordering inputs and is only reachable for the explicitly bounded public page-1 shape.
- `REQ-159-004`: On expiry or a cache miss, the existing product query runs and its result becomes the value for the eligible key; no stale value is served beyond the existing TTL contract.
- `REQ-159-005`: Search, price, arbitrary filters, personalization, curated catalogues, and non-page-1 requests retain the current uncached query path.
- `REQ-159-006`: Existing product result shape, total count, ordering, media enrichment, filter metadata, and error behavior remain unchanged.
- `REQ-159-007`: Add observable hit/miss or query-volume evidence using the repository’s existing safe logging/measurement conventions without logging customer data or changing production data.

## Scenarios

- `SCN-159-001`: The first eligible category-only page-1 request queries the database; an identical request within 60 seconds returns the cached result.
- `SCN-159-002`: Category plus price-ascending, price-descending, created-at ascending, and created-at descending requests each use the correct independent key and preserve ordering.
- `SCN-159-003`: After the 60-second TTL, an eligible request refreshes from the database and later identical requests use the refreshed value.
- `SCN-159-004`: Free-text search, any price range, non-page-1, subcategory, product type, brand, color, size, discount, curated, and personalized requests bypass the new cache.
- `SCN-159-005`: A cache miss/query failure follows the current error path and does not return data from a different category or sort key.
- `SCN-159-006`: Filter-panel metadata and displayed products remain aligned for a category request; adding or removing a cache hit does not change counts or selected-filter behavior.

## Invariants

- `INV-159-001`: A cache key never represents more than one category and one allowlisted sort shape.
- `INV-159-002`: No request containing an out-of-scope filter or user-specific recommendation input is served from this cache.
- `INV-159-003`: Cached values contain only the same public catalog result that the existing query returns; authorization and visibility predicates are unchanged.
- `INV-159-004`: TTL remains 60 seconds, and cache misses/expiry never silently use another key’s result.
- `INV-159-005`: Cache instrumentation is bounded and contains no secrets, customer data, or raw arbitrary search text.

## Implementation contract

Prefer a small wrapper alongside the existing `getCachedDefaultProducts` and `getCachedNewArrivalProducts` functions. The wrapper should accept a validated key descriptor and call the existing `productQueries.getProducts` with the same public predicates and `requireMedia: true`. Dynamic `unstable_cache` keys or an equivalent repository-supported bounded cache are acceptable only if the key is deterministic and the TTL is explicit. Do not wrap the general `getProducts` method because its broad parameter surface includes unbounded and personalized queries.

The implementation must preserve the existing normalized storefront decision order: recommendation handling and curated/catalog contexts take precedence, then eligible category caching, then the existing default/new-arrival cache, then the direct query path. If the current ordering normalization treats `recommended` as no explicit sort, category-only must remain distinct from an explicit sort request only where the resulting query behavior differs.

## Verification plan

- Add focused unit tests for eligibility and canonical key construction, including key non-collision.
- Add cache behavior tests with an injectable clock/cache or the project’s existing cache seam: first-call miss, identical-call hit, independent sort keys, and TTL refresh.
- Add bypass tests for search, price, extra filters, personalized results, curated context, and page > 1.
- Add a regression test that compares cached and direct result arguments/shape for a category-only and category-plus-sort request.
- Run `bun test` and `bun run governance:validate -- docs/.work-items/REN-159/work-item.yaml`.
- Review query-volume/hit-miss evidence in a non-production test or staging environment before rollout.

## Rollout and rollback

The change is additive and read-through. Rollback is a code revert or disabling the new wrapper, returning eligible requests to the existing direct query path. No data migration or cache migration is required. Monitor database query volume, cache errors, result counts, and ordering for category pages for at least one TTL window after deployment.

## Risks and mitigations

- Stale catalog data: bounded by the existing 60-second TTL; no longer TTL or mutation semantics are introduced.
- Key collision or incomplete key: centralize canonical key construction and test every result-affecting eligible input.
- Caching a personalized or filtered response: use an explicit eligibility predicate with fail-closed defaults.
- Filter-count mismatch: leave filter metadata uncached and verify it against displayed results.
- Cache wrapper incompatibility with dynamic arguments: use a supported deterministic key/API and keep the broad query function uncached.
