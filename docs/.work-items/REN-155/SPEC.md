# REN-155 — `requireMedia` pagination count consistency

## Objective

Ensure catalog pagination and total counts agree for the common case where
`requireMedia` excludes products with no media rows.

## Evidence

- `src/lib/db/queries/product.ts:getProducts` already adds
  `hasMedia(products, "media")` when `requireMedia` is true.
- The same `whereClause` is used by the page query and the SQL count query,
  so products with zero media rows are excluded from both today.
- Therefore the scoped SQL predicate itself appears already present in the
  current baseline; the implementation deliverable is to preserve it with
  regression coverage and add the issue-requested measurement for the later
  valid-URL filter.
- After fetching, `requireMedia` applies a second in-memory filter requiring a
  resolved media item with a URL. That later filter can make `data.length`
  smaller than `limit` while `count` still includes stale/unresolvable media.
- The issue explicitly scopes the fix to the existing SQL-level
  `hasMedia()` predicate and excludes full stale-cache URL resolution.

## Scope

In scope:

- Preserve the existing DB-level `hasMedia()` filter for `requireMedia`.
- Verify the page and count use the same zero-media-row predicate.
- Add focused regression coverage for products with and without media rows.
- Emit a structured server-side metric/log event for products removed by the
  post-fetch valid-URL filter, including input count, output count, and the
  active catalog/search shape needed to measure the residual mismatch.
- Preserve the existing post-fetch valid-URL filter and document its bounded
  stale-cache limitation.

Out of scope:

- Schema or migration changes.
- Changing Redis/media URL resolution semantics.
- Making the SQL count reproduce external media-cache URL validity.
- Changes to unrelated product filters, sorting, search, or recommendation
  queries.

## Risk assessment

- Initial risk: `L2` — changes catalog result inclusion and pagination counts.
- Path-rule risk: `L2` — shared product query has multiple storefront and API
  callers, but no payment, order, inventory, or external write path is crossed.
- Semantic risk: `L2` — an incorrect predicate can hide products or misstate
  pagination, while rollback is a small query change.
- Final risk: `L2`.

## Requirements

- `REQ-155-001`: When `requireMedia` is true, products with zero media rows
  are excluded from both the page query and the SQL total count.
- `REQ-155-002`: When `requireMedia` is false or omitted, existing product
  inclusion and count behavior remains unchanged.
- `REQ-155-003`: Existing valid-media URL post-processing remains unchanged;
  this task does not claim to count stale or invalid cached URLs in SQL.
- `REQ-155-004`: The implementation remains scoped to `getProducts` and does
  not alter unrelated catalog filters or callers.
- `REQ-155-005`: Emit a structured server-side `catalog_media_post_filter`
  observation whenever `requireMedia` removes products after media-cache
  resolution, with input count, output count, removed count, and whether a
  search was active. Emit it through the existing server stdout/log pipeline
  as one structured JSON object; telemetry failure must not change query
  results.

## Scenarios

- `SCN-155-001`: A page contains products with and without media rows while
  `requireMedia` is true; products without media rows are absent from both
  returned data and count.
- `SCN-155-002`: A page contains only products with media rows; data length,
  page boundaries, and count remain unchanged.
- `SCN-155-003`: `requireMedia` is false or omitted; products without media
  rows remain eligible as before.
- `SCN-155-004`: A product has a media row whose cached URL is unavailable;
  the existing post-fetch filter may remove it, and this known limitation is
  not expanded into a new count contract.
- `SCN-155-005`: The post-fetch filter removes one or more products; a
  structured observation records the mismatch without affecting the returned
  data or count.

## Invariants

- `INV-155-001`: The page query and SQL count query use the same effective
  zero-media-row predicate when `requireMedia` is true.
- `INV-155-002`: `requireMedia` does not affect results when disabled.
- `INV-155-003`: No caller outside `getProducts` receives a changed filter
  contract.
- `INV-155-004`: The SQL count does not pretend to know external cached URL
  validity.
- `INV-155-005`: Observability is best-effort and cannot change catalog data,
  count, ordering, or error behavior.

## Flow

- `FLOW-155-001`: Build filters → apply `hasMedia` when required → execute
  paginated data query and count query with the shared `whereClause` → map
  media → retain the existing valid-URL post-filter.

## Dependencies

- `DEP-155-001`: Drizzle `hasMedia(products, "media")` query helper — resolved;
  existing helper is already used by `getProducts`.
- `DEP-155-002`: Existing media cache URL resolution — resolved for current
  behavior; its stale-cache edge remains out of scope.
- `DEP-155-003`: Existing `getProducts` callers — resolved; callers pass
  `requireMedia` for storefront/API catalog paths and need regression coverage.

## Decisions

- `DEC-155-001` (`AUTO_DECIDE`, resolved): Reuse the existing SQL
  `hasMedia()` predicate rather than adding schema/query architecture because
  it already expresses the issue's common zero-media-row case.
- `DEC-155-002` (`RECOMMEND_CONTINUE`, resolved): Keep stale/unresolvable
  cached media URLs out of the SQL count contract because resolving them
  requires external cache data and is explicitly outside this issue.

## Test expectations

- `TEXP-155-001` (`unit`, REQUIRED): Verify the filter builder includes
  `hasMedia` only when `requireMedia` is true.
- `TEXP-155-002` (`integration`, REQUIRED): Verify zero-media products are
  absent from both paginated data and count when `requireMedia` is true.
- `TEXP-155-003` (`regression`, REQUIRED): Verify disabled/omitted
  `requireMedia` preserves existing data and count behavior.
- `TEXP-155-004` (`regression`, REQUIRED): Verify existing product filters,
  ordering, and valid-media post-processing remain intact.
- `TEXP-155-005` (`exploratory`, OPTIONAL): Observe the known stale-cache URL
  mismatch and confirm it is not treated as part of this fix.
- `TEXP-155-006` (`unit`, REQUIRED): Verify the structured post-filter
  observation contains input/output/removed counts and search context, and
  that telemetry failure does not alter query behavior.

Concrete test strategy:

- Extract a pure conditional predicate selector and assert it returns the
  existing `hasMedia` SQL predicate only for `requireMedia: true`.
- Extract a pure observation builder and assert no observation is produced
  when no rows are removed, while removals produce the exact event name and
  counts.
- Exercise the post-filter helper with products representing no media,
  resolved media URL, and unresolved media URL; assert stable ordering and
  unchanged behavior when `requireMedia` is disabled.
- Keep database and Redis error propagation unchanged; the telemetry emission
  itself is wrapped best-effort and tested with a throwing sink.

## Approval

This L2 contract received independent read-only Critic review and was approved
by Ayan Ganguly. The current baseline already contains the SQL predicate, so
the approved diff must not duplicate it; it adds testable helper boundaries,
the missing structured measurement, and regression proof while preserving
the shared query contract.
