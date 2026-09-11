# REN-190 — Festive catalog rebuild

## Outcome

Replace the custom `/festive` catalogue with the shared `StorefrontCatalogPage` used by `/swap-passport`. Keep the approved festive banner and festive palette, while using the shared mobile-first search, filter drawer, sort controls, product cards, and URL pagination.

## Product source of truth

Admin → Products → **Festive Season** is the only source of products displayed on `/festive`. The existing `festiveSeasonProducts` rows determine the eligible product IDs. A product that is not selected there must not appear through direct URLs, search, paging, client refetches, or filter combinations.

## Implementation contract

- Add an optional `catalogContext` to the shared storefront catalogue. `/festive` supplies the literal `festive`; the browser never sends product IDs.
- In the server-side product tRPC route, `catalogContext: "festive"` resolves `getFestiveSeasonProducts()` and passes the resulting IDs and ordered positions into the internal product query. A supplied context can never widen results beyond that selection.
- In the server-rendered filter path, the same server-resolved selection is passed to all six metadata queries: brands, category counts, subcategory counts, colours, alpha sizes, and numeric sizes.
- Reuse the current `getFestiveSeasonProducts()` selection and its position ordering for the default festive view. Equal/blank positions use `products.createdAt DESC`, then `products.id ASC`, as stable tie-breakers.
- Retain standard catalogue sorting when a shopper chooses a sort option; disable recommendations for the festive context and keep RAG search results as an AND-condition with the resolved scope.
- Render the supplied festive desktop and mobile banner assets in the shared catalogue hero area, using the existing cream, pink, and green festive styling.
- Remove the bespoke festive search, chips, local pagination, and duplicate product-card implementation.
- On Festive Season admin changes, invalidate `/festive`; browser queries for the festive context must not use a global default-catalogue cache. An empty selection must return an empty shared catalogue state.
- Preserve `/swap-passport` behavior and all other catalogue pages.

## Exact scope, order, and cache contract

- `catalogContext` is a closed internal union: absent or `"festive"`. It is included in the tRPC input, the React Query input/prefetch key, and the serialized `getStorefrontFilterData` cache input.
- The tRPC route is the enforcement boundary. For `"festive"`, it fetches `festiveSeasonProducts`, de-duplicates product IDs, and supplies an internal `curatedProductIds` array only to database query functions. Arbitrary caller-provided product IDs are not accepted by the public tRPC input.
- All six filter queries receive the internal de-duplicated IDs. An empty internal list appends an always-false predicate; it never omits the predicate.
- On an unsorted festive request, the product query creates an order expression from the ordered curated IDs (the index of each ID), followed by `createdAt DESC`, followed by `id ASC`. On an explicit shopper sort, it omits curator ordering and applies the requested shared sort followed by `id ASC`, still constrained by the same IDs.
- Festive requests bypass `getCachedDefaultProducts` and `getCachedNewArrivalProducts`; no existing global cache key is reused. Context appears in every newly introduced server cache key.
- `toggleFestiveSeasonProduct` calls `revalidatePath("/festive")` after its existing update. Client queries use the context-bearing input and are invalidated/refetched on the next navigation or query-key change; no product is retained under a global default key.

## Verification

- Unit coverage for server-resolved product scoping, empty scopes, duplicate selection handling, and default curator order/tie-breakers.
- Regression coverage that a selected product appears, an unselected product never appears, and direct client endpoint, search/RAG, filter/paging, and filter metadata cannot escape the scope.
- Browser checks at mobile and desktop widths for banner, shared controls, products, filters, sort controls, and pagination.
