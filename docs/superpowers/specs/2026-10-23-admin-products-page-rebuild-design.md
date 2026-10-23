# Admin Products Page Rebuild Design

## Intent

Restore the general-admin products page as a fast, predictable catalogue-management surface. Search, brand filters, pagination, loading feedback, and table layout must work together without delayed or stale results.

## Goals

- Keep filtering and pagination server-side so the displayed count, rows, and pages describe the same result set.
- Make admin search fast and deterministic for product title, product/variant SKU, and brand name.
- Reset to page 1 whenever a result-changing filter changes, while preserving the selected page during ordinary page navigation.
- Show immediate loading feedback while retaining the previous rows to avoid layout jumps.
- Present primary controls clearly on desktop and mobile, with secondary catalogue filters grouped separately.
- Keep URL query parameters as the shareable source of truth.

## Non-goals

- No database schema, migration, permissions, product-editing, or public-shop search changes.
- No replacement of the shared design system or table library.
- No client-side loading of the complete product catalogue.

## Constraints

- Use the existing Next.js, tRPC, TanStack Query/Table, nuqs, and Tailwind stack.
- Preserve the existing product actions, selectable rows, QC summary, and column visibility.
- Use Bun for tests and scripts.

## Approaches

1. Patch each symptom independently. This is the smallest diff but retains competing server, URL, table, and query-cache state; it is likely to regress again.
2. Keep server-side listing but establish one normalized admin query contract shared by SSR and the client. Use placeholder data instead of seeding every cache key, debounce search, reset page on filter changes, and add a dedicated lightweight admin search predicate. **Chosen** because it fixes the stale-page/filter behavior and search latency without changing the database or public catalogue.
3. Load all products and filter/paginate in the browser. This makes interactions instant after a large initial request but does not scale, exposes more data than needed, and makes counts stale.

## Design

The page parser and client table will both normalize URL values into the same admin-list input, including brand IDs and every visible filter. The client query always sends `adminList: true`. Server data is used only as transition placeholder content; it is not installed as fresh data for unrelated query keys.

Search input has immediate local typing state and commits a trimmed value after a short debounce (or immediately on Enter). Committing search or any filter also resets `page` to 1. The admin database path bypasses semantic/RAG services and applies a parameterized local predicate over titles, product SKU, variant SKUs, and brand name.

The controls are split into a primary toolbar (search, brands, approval status, clear) and an advanced responsive grid. The table retains its sticky header and previous rows while a visible loading overlay and busy semantics communicate updates. Pagination clamps invalid pages and uses explicit button behavior rather than navigational links with `#` targets.

## Success criteria

- Clicking Next changes the query to the next page immediately and never reuses page-one data as fresh data.
- Selecting one or more brands immediately requests and displays only those brands, beginning on page 1.
- Search does not issue a request per keystroke and does not call embeddings/RAG for an admin list.
- All filter changes reset pagination; page-size changes continue to reset pagination.
- Loading, empty, and result-count states are visible and stable.
