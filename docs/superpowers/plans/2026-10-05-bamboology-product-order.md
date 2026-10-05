# Bamboology Product Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Bamboology brand shop default catalogue follow the requested category and subcategory precedence.

**Architecture:** Add a pure ranking helper in the existing merchandising module. The brand route supplies category-aware subcategory metadata to the catalog page, which converts the helper result into the existing `prioritizedSubcategoryIds` query input. The query's current explicit-sort/search guards and created-at tie-breaker remain authoritative.

**Tech Stack:** TypeScript, Next.js App Router, Drizzle query ordering, Bun tests.

**Spec:** `docs/.work-items/REN-261/SPEC.md`

## Global Constraints

- Scope the new priority to the Bamboology brand route.
- Do not change schemas, migrations, product data, inventory, checkout, or payment behavior.
- Explicit shopper sort, search, filters, pagination, and non-Bamboology routes retain existing behavior.
- Use Bun for tests and governance validation.

## Review Focus

- Duplicate subcategory names across categories must not collapse into one priority.
- Unknown categories/subcategories must remain visible after prioritized records.
- Empty metadata must produce an empty/no-op priority without throwing.
- Existing query guards must continue to disable merchandising priority for search and explicit sorts.

### Task 1: Category-aware Bamboology ranking

**Files:**

- Modify: `src/lib/catalog/merchandising.ts`
- Test: `src/lib/catalog/merchandising.test.ts`

**Interfaces:**

- Produces: `rankProductIdsByCategoryAndSubcategory(subcategories, categories, options): string[]`, returning subcategory IDs in display priority order.

- [ ] Write a failing test for Women → Men → Home and Living → Beauty and Personal Care, high-priority subcategories, last innerwear subcategories, unknown fallback, and duplicate names across categories.
- [ ] Run `bun test src/lib/catalog/merchandising.test.ts` and confirm the new test fails because the helper is absent.
- [ ] Implement the minimal pure helper using normalized names and category IDs.
- [ ] Run the focused test and confirm it passes.
- [ ] Run `bun test src/lib/catalog/merchandising.test.ts` again after refactoring.

### Task 2: Wire only Bamboology into the catalog

**Files:**

- Modify: `src/components/shop/storefront-catalog-page.tsx`
- Modify: `src/app/(marketing)/brands/[id]/shop/page.tsx`
- Test: `tests/ren-261-bamboology-product-order.test.ts`

**Interfaces:**

- Consumes: Task 1 helper and cached category/subcategory metadata.
- Produces: Bamboology-only `prioritizedSubcategoryIds` passed to the existing product query path.

- [ ] Write failing source-level regression tests for route opt-in, category metadata wiring, and preservation of search/explicit-sort guards.
- [ ] Run `bun test tests/ren-261-bamboology-product-order.test.ts` and confirm the assertions fail before wiring.
- [ ] Pass category metadata into the priority helper and replace the current Bamboology-only subcategory list.
- [ ] Run the regression tests and confirm they pass.
- [ ] Run `bun test`.
- [ ] Run `bun run governance:validate -- docs/.work-items/REN-261/work-item.yaml`.
