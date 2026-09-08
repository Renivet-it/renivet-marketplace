# REN-154 Specification

## Goal

Measure search quality across the complete storefront journey: the analytics row created by a search submission must receive the authoritative result count, and selecting a result must record the selected product on that same row.

## Evidence and scope

- `processSearch` currently classifies and inserts a `search_analytics` row but does not return its inserted ID.
- `logSearchClick` currently accepts `searchId` and `productId` but discards the product ID.
- `search_analytics` already contains `resultCount` and `clickedProductId`; no schema or migration is required.
- The catalog query, not the classifier, owns the authoritative paginated `count` (`finalData.count`). A classifier-only redirect cannot know this value without duplicating catalog work.
- The results grid already emits product-click tracking. Search-click analytics must be additive and must not block navigation or remove the existing product event.
- REN-149 supplies the server-owned redirect URL, but the redirect context must additionally carry the opaque search row ID through `/shop` and the brand-to-brand-shop redirect.
- In scope: search analytics helpers and tRPC route behavior, search context transport, catalog result-count reconciliation, result-grid click wiring, and focused automated/manual verification.
- Out of scope: ranking/relevance changes, schema migrations, product-event taxonomy changes, authentication changes, and notification or catalog behavior changes.

## Acceptance criteria

- Each successful search submission creates one analytics row and returns an opaque `searchId` alongside the existing redirect result.
- The initial catalog request updates that row with the catalog query's authoritative total count; it is safe to repeat the update during refreshes and is not performed for unrelated/default catalog loads.
- Search context survives category, subcategory, product-type, unknown-search, and brand redirects, including the existing brand slug-to-shop redirect; it does not alter canonical SEO URLs or visible search behavior.
- Selecting a product with search context updates that exact row's `clickedProductId` and preserves existing product-click tracking and navigation when analytics is unavailable.
- Invalid or missing search IDs are ignored/rejected safely; a search click cannot update a different row, expose query contents, or alter catalog/order state.
- Tests cover insert-ID propagation, result-count reconciliation, all redirect forms, brand query preservation, click persistence, duplicate/invalid clicks, analytics failure isolation, and unchanged search results/navigation.

## Design decision

Use a two-phase analytics lifecycle. `processSearch` inserts the row and returns its ID; the server-side catalog fetch then writes `finalData.count` to that ID for the initial page. The ID is transported as a query parameter/context value because the current redirect architecture is URL-based, and the brand slug redirect must explicitly preserve it. The click handler sends a best-effort `logSearchClick` mutation in addition to the existing product-click beacon. The UUID acts as a narrow opaque capability for updating only `clickedProductId`/`resultCount`; no user identity or query text is trusted from the browser, and analytics failures never affect the storefront.

