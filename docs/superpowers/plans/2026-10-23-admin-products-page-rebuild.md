# Admin Products Page Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the admin products list so search, brand filtering, pagination, loading feedback, and responsive table controls are fast and reliable.

**Architecture:** Preserve server-side pagination and filtering while centralizing admin query normalization and separating admin text search from public semantic search. Keep URL state canonical, use debounced local input for typing, and use previous results only as placeholder data during a real request.

**Tech Stack:** Next.js 15, React 19, tRPC, TanStack Query/Table, nuqs, Drizzle ORM, Bun test

**Spec:** `docs/superpowers/specs/2026-10-23-admin-products-page-rebuild-design.md`

## Global Constraints

- Do not change database schemas, migrations, permissions, product editing, or public shop search behavior.
- Preserve product actions, selectable rows, QC summary, and column visibility.
- Use Bun for tests and scripts.

## Review Focus

- A page greater than one followed by any filter change must request page one.
- A new React Query key must not receive unrelated SSR rows as fresh cache data.
- Brand options must remain complete while product search text is active.
- Empty and whitespace-only search must not run admin search predicates.
- Rapid typing must commit only the latest search value and must expose an updating state.

---

### Task 1: Admin query contract and fast search

**Files:**
- Create: `src/lib/db/queries/product-admin-search.ts`
- Create: `src/lib/db/queries/product-admin-search.test.ts`
- Modify: `src/lib/db/queries/product.ts`
- Modify: `tests/admin-products-performance.test.ts`

**Interfaces:**
- Produces: `getAdminProductSearchPredicate(search: string): SQL | undefined`
- Produces: admin list queries that bypass embedding and RAG work.

- [ ] Write failing tests proving admin search covers title, product SKU, variant SKUs, and brand name with parameterized values.
- [ ] Run the focused tests and confirm the predicate is missing.
- [ ] Implement the predicate and select it before the semantic public-catalogue path when `adminList` is true.
- [ ] Add a behavioral guard proving the admin path does not invoke the semantic branch.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Unified URL and query state

**Files:**
- Create: `src/components/dashboard/general/products/admin-products-query-state.ts`
- Create: `src/components/dashboard/general/products/admin-products-query-state.test.ts`
- Modify: `src/app/(protected)/dashboard/general/products/page.tsx`
- Modify: `src/components/dashboard/general/products/products-review-table.tsx`

**Interfaces:**
- Produces: normalized admin query input from current URL-backed filter values.
- Consumes: `getProducts` with `adminList: true`.

- [ ] Write failing tests for normalized filters, multiple brand IDs, page preservation, and page-one reset decisions.
- [ ] Run the focused tests and confirm failures for the missing state helper.
- [ ] Implement the state helper and use the same normalization in SSR and the client query.
- [ ] Replace per-key `initialData` with transition placeholder data and reset page for every result-changing filter.
- [ ] Debounce search commits while keeping typing immediate and Enter-to-search available.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Table controls, loading, and pagination

**Files:**
- Modify: `src/components/dashboard/general/products/products-review-table.tsx`
- Modify: `src/components/ui/data-table.tsx`
- Modify: `src/components/ui/data-table-dash/pagination.tsx`
- Create: `src/components/ui/data-table-pagination-state.ts`
- Create: `src/components/ui/data-table-pagination-state.test.ts`

**Interfaces:**
- Produces: clamped page/range calculations and explicit pagination buttons.
- Consumes: current page, total pages, result count, row count, and loading state.

- [ ] Write failing tests for page clamping, next/previous bounds, and displayed ranges.
- [ ] Run the focused tests and confirm the helper is missing.
- [ ] Implement pagination state helpers and use them in the shared table/pagination controls.
- [ ] Recompose admin controls into primary and advanced responsive groups; add busy and loading semantics without clearing current rows.
- [ ] Run focused tests, `bun test`, and TypeScript checks.

### Task 4: End-to-end verification and review

**Files:**
- Modify only if a failing verification produces a covered defect.

**Interfaces:**
- Consumes: completed Tasks 1-3.

- [ ] Run the admin-products focused tests.
- [ ] Run `bun test` and record any pre-existing failures separately.
- [ ] Run the repository TypeScript check/build command and inspect output.
- [ ] Exercise search, brand filtering, next/previous pagination, page size, loading, empty state, and mobile layout in the browser when the local environment permits.
- [ ] Review the complete diff against the design and repository instructions.
