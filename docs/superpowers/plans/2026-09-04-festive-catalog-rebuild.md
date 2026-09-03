# Festive Catalog Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bespoke `/festive` UI with the shared Swap Passport catalogue, limited to server-resolved festive products.

**Architecture:** The shared catalogue gets an optional closed `catalogContext: "festive"`. The tRPC route resolves the current Admin → Products → Festive Season selection on the server, and passes internal IDs to results and all filter metadata queries. The browser never supplies selected IDs.

**Tech Stack:** Next.js, React, TypeScript, Drizzle, tRPC, Nuqs, Bun.

**Spec:** `docs/.work-items/REN-190/SPEC.md`

## Global Constraints

- Scope results and every metadata query to the server-derived festive selection.
- Empty selection is an explicit false predicate and renders zero products.
- Default ordering is curator position, then `createdAt DESC`, then `id ASC`; explicit shopper sorting remains scoped.
- Context is part of filter-cache and React Query keys; festive bypasses global catalogue caches.

### Task 1: Add trusted scope and ordering

**Files:** `src/lib/db/queries/product.ts`, `src/lib/trpc/routes/brands/products.ts`, `tests/festive-catalog-scope.test.ts`

- [ ] Write a failing test asserting the tRPC input accepts only `catalogContext: z.literal("festive").optional()`, resolves `getFestiveSeasonProducts()`, and no public product-ID input exists.
- [ ] Run `bun test tests/festive-catalog-scope.test.ts`; it must fail before the route change.
- [ ] Add internal `curatedProductIds?: string[]` and `curatedDefaultOrder?: string[]` to `getProducts`. On festive context the tRPC route resolves and de-duplicates rows, forwards IDs internally, disables recommendations, and does not expose IDs in the public schema. Add `inArray(products.id, curatedProductIds)` or an explicit false SQL condition for an empty array.
- [ ] Build default scope ordering as a parameterized CASE for curated IDs, then `desc(products.createdAt)`, `asc(products.id)`. An explicit shopper sort omits CASE and appends `asc(products.id)` after the requested sort.
- [ ] Run `bun test tests/festive-catalog-scope.test.ts` and commit `feat: scope festive catalog queries on the server`.

### Task 2: Scope filters, cache identity, and client refetches

**Files:** `src/lib/db/queries/product.ts`, `src/components/shop/storefront-catalog-page.tsx`, `src/components/shop/shop-products.tsx`, `tests/festive-catalog-scope.test.ts`

- [ ] Add failing assertions that `StorefrontCatalogPage` and `ShopProducts` propagate `catalogContext`, and that filter serialization includes it.
- [ ] Run `bun test tests/festive-catalog-scope.test.ts`; it must fail before propagation.
- [ ] Add `catalogContext?: "festive"` to the shared page and resolve the selection server-side for `getUniqueBrands`, `getFilteredCategoryCounts`, `getFilteredSubCategoryCounts`, `getUniqueColors`, `getAlphaSizes`, and `getNumericSizes`. Each helper receives only internal IDs and uses the explicit-false empty condition.
- [ ] Include context in serialized filter cache input, tRPC/React Query input, and prefetch keys. Make festive bypass `getCachedDefaultProducts` and `getCachedNewArrivalProducts`.
- [ ] Run `bun test tests/festive-catalog-scope.test.ts && bun test` and commit `feat: apply festive scope to storefront filters`.

### Task 3: Replace `/festive` with shared catalogue

**Files:** `src/app/(home)/festive/page.tsx`, `src/components/home/new-home-page/festive-season.tsx`, `src/actions/product-action.ts`, `tests/festive-landing-ui.test.ts`

- [ ] Write a failing page test asserting `StorefrontCatalogPage`, `basePath="/festive"`, `catalogContext="festive"`, and both approved banner asset names. Assert the old client local-paging implementation is no longer rendered.
- [ ] Run `bun test tests/festive-landing-ui.test.ts`; it must fail before the page rewrite.
- [ ] Make `/festive` a thin `StorefrontCatalogPage` page with the approved desktop/mobile banner hero and the festive cream/pink/green wrapper. Remove bespoke search, chips, cards, and pagination. Add `revalidatePath("/festive")` to the successful festive admin toggle.
- [ ] Run `bun test tests/festive-landing-ui.test.ts && bun test` and commit `feat: rebuild festive page on shared storefront catalog`.

### Task 4: Verify and record evidence

**Files:** `docs/.work-items/REN-190/REVIEW.md`

- [ ] Run `bun test` and `bun run governance:validate -- docs/.work-items/REN-190/work-item.yaml`.
- [ ] In the local browser, verify `/festive` at 390px (banner, search, filters, sort, cards, pagination) and 1440px (wide banner, sidebar, catalogue), then verify `/swap-passport` remains unchanged.
- [ ] Verify selected products appear, unselected products remain absent from server/client/filter paths, an empty selection stays empty, and a direct festive tRPC request cannot widen scope.
- [ ] Record commands, routes, viewport evidence, and unrelated build/type limitations in `REVIEW.md`; commit `docs: record festive catalog verification`.

## Self-Review

- Tasks 1–2 cover trusted scope, RAG containment, metadata, ordering, cache isolation, and client parity.
- Task 3 covers the approved responsive visual outcome and admin invalidation.
- Task 4 covers responsive, data-containment, regression, test, and governance evidence.
