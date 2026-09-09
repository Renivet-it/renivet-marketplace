# REN-150 — Preserve personalized recommendation rank on the shop page

## Decision

Status: `IN_REVIEW`. Implementation is not authorized until the owner approves this contract.

Risk: `L1`. The change is confined to one catalog-query order expression; it changes customer-visible ranking but no data, API, authorization, payment, or external-integration behavior.

## Evidence and scope

`ProductQuery.getProducts()` accepts a server-generated `priorityProductIds` list. The storefront catalog and brands products route build that list from personalized recommendation results. The current SQL places every listed ID in one binary bucket, so the subsequent best-seller and recency clauses decide the order inside that bucket.

The same method already has a position-preserving `CASE` expression for RAG IDs. REN-150 will use the equivalent indexed `CASE` shape for `priorityProductIds` only.

In scope: one `orderBy` expression and focused ranking regression coverage.

Out of scope: changing recommendation scoring, product eligibility, RAG ordering, explicit user-selected sort behavior, database schema, endpoint/API shape, caching, or analytics instrumentation.

## Requirements

- `REQ-150-001`: When `priorityProductIds` is present, preserve the supplied ID order for the personalized-product ordering clause.
- `REQ-150-002`: Keep products absent from `priorityProductIds` after all listed products in that clause.
- `REQ-150-003`: Preserve all later order clauses, including best-seller, recency, explicit sort, and RAG behavior.
- `REQ-150-004`: Do not alter how recommendation IDs are computed or passed by callers.

## Scenarios and invariants

- `SCN-150-001`: Input `[A, B, C]` ranks products A, then B, then C before unlisted products.
- `SCN-150-002`: An unlisted best seller does not displace a listed product within the personalized ranking clause.
- `SCN-150-003`: Empty or omitted `priorityProductIds` leaves existing ordering unchanged.
- `SCN-150-004`: A RAG search retains its existing, independent RAG relevance ordering.
- `SCN-150-005`: The recommendation producers retain their existing ID list and eligibility behavior.

- `INV-150-001`: The index of a listed ID is its personalized rank; lower index means earlier result.
- `INV-150-002`: The change does not widen the candidate set or alter filtering.
- `INV-150-003`: Explicit sort and RAG ordering behavior remain unchanged.

## Architecture, dependencies, and decisions

- `FLOW-150-001`: Server-side recommendation result → ordered `priorityProductIds` → `getProducts()` position-preserving personalized order clause → existing subsequent ordering clauses.
- `DEP-150-001`: Existing recommendation producers in storefront catalog and brands product routes.
- `DEP-150-002`: Existing `getProducts()` RAG CASE expression, used only as a local implementation pattern.
- `BR-150-001`: The recommendation producer determines relevance; the catalog query must preserve that order.
- `DEC-150-001` (`AUTO_DECIDE`, resolved): Copy the existing RAG CASE pattern's rank semantics rather than introduce a new ranking representation. Basis: it is the stated issue target, localized, and reversible.

`priorityProductIds` are currently supplied by server-side recommendation or catalog code, not a newly accepted client input. Implementation must not expand the raw SQL interpolation surface or change ID provenance.

## Test expectations

- `TEXP-150-001` (`unit`, REQUIRED): Verify the rank-expression helper or SQL construction assigns positions 0, 1, and 2 to ordered personalized IDs and a later fallback rank to unlisted IDs.
- `TEXP-150-002` (`regression`, REQUIRED): Verify the current RAG ordering predicate/expression behavior remains unchanged.
- `TEXP-150-003` (`integration`, REQUIRED): Verify a representative `getProducts()` invocation returns the supplied personalized order before best-seller/recency tie-breakers.
- `TEXP-150-004` (`exploratory`, REQUIRED): In staging, use a known recommendation order and confirm the default Recommended view matches it.

Rollback is a single-expression revert; no data repair is required.
