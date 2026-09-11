# REN-174 Inventory Cancellation Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore cancelled inventory by the exact item delta and prevent negative product or variant stock.

**Architecture:** Keep `updateProductStock` as the shared relative-decrement mutation. Change only cancellation callers to pass `item.quantity`, and add a SQL zero floor inside the shared mutation. Preserve order-creation decrements, authorization, refunds, shipments, and status transitions.

**Tech Stack:** TypeScript, Drizzle ORM, PostgreSQL SQL expressions, Bun tests.

**Spec:** `docs/.work-items/REN-174/SPEC.md`

## Global Constraints

- No schema or migration changes.
- Cancellation must reverse the original decrement exactly once.
- Product and variant stock must never persist below zero.
- Existing order creation, authorization, refund, shipment, and status behavior must remain unchanged.
- Run `bun test` and `bun run governance:validate -- docs/.work-items/REN-174/work-item.yaml` before completion.

---

### Task 1: Add failing regression coverage

**Files:**

- Create: `src/lib/inventory/cancellation-stock.test.ts`
- Test: `src/lib/inventory/cancellation-stock.test.ts`

- [ ] **Step 1: Write the failing tests**

Add pure contract tests for a helper describing the cancellation delta and floor:

```ts
test("cancellation uses the item quantity as its restoration delta", () => {
    expect(
        buildCancellationStockDelta({ currentStock: 3, itemQuantity: 2 })
    ).toEqual(2);
});

test("stock mutation clamps a negative result to zero", () => {
    expect(applyRelativeStockDelta({ currentStock: 1, delta: 3 })).toBe(0);
});
```

Also add source-contract assertions that both cancellation callers pass `quantity: item.quantity` and do not compute `currentStock + quantity`.

- [ ] **Step 2: Run the tests and verify the expected failure**

Run: `bun test src/lib/inventory/cancellation-stock.test.ts`

Expected: FAIL because the pure helper and corrected cancellation source contract do not yet exist.

### Task 2: Implement the shared safe stock contract

**Files:**

- Modify: `src/lib/db/queries/product.ts:3497-3555`
- Test: `src/lib/inventory/cancellation-stock.test.ts`

- [ ] **Step 1: Add the database floor**

Change the shared Drizzle expressions to:

```ts
quantity: sql`GREATEST(${productVariants.quantity} - ${item.quantity}, 0)`;
```

and the equivalent `products.quantity` expression. Keep the existing transaction, result handling, reconciliation, and QC refresh unchanged.

- [ ] **Step 2: Run the focused tests**

Run: `bun test src/lib/inventory/cancellation-stock.test.ts`

Expected: PASS.

### Task 3: Correct both cancellation callers and preserve decrement callers

**Files:**

- Modify: `src/lib/trpc/routes/general/orders.ts:1944-1955`
- Modify: `src/lib/support/cancel-order-helper.ts:127-138`
- Test: `src/lib/inventory/cancellation-stock.test.ts`

- [ ] **Step 1: Replace absolute targets with deltas**

In both cancellation paths, replace the `currentStock` calculation and `quantity: currentStock + quantity` with:

```ts
return {
    productId: item.product.id,
    variantId: item.variant?.id,
    quantity: item.quantity,
};
```

- [ ] **Step 2: Verify order-creation callers remain deltas**

Confirm `src/lib/trpc/routes/general/orders.ts:1300` and `src/app/api/webhooks/razorpay/payments/route.ts:636` still pass positive item quantities to the shared subtracting mutation. Do not change these paths.

- [ ] **Step 3: Run focused tests**

Run: `bun test src/lib/inventory/cancellation-stock.test.ts src/lib/db/queries/product-ordering.test.ts`

Expected: PASS.

### Task 4: Full verification and governance review

- [ ] **Step 1: Run the complete suite**

Run: `bun test`

Expected: zero failures.

- [ ] **Step 2: Validate the work item**

Run: `bun run governance:validate -- docs/.work-items/REN-174/work-item.yaml`

Expected: governance validation passed.

- [ ] **Step 3: Review the diff and run post-implementation reconciliation**

Inspect `git diff --check` and the exact base-to-head scope, then invoke `renivet-review REN-174` so `REVIEW.md` and the normalized implementation-review result reflect the final implementation.

- [ ] **Step 4: Commit the implementation**

```bash
git add src/lib/inventory/cancellation-stock.test.ts src/lib/db/queries/product.ts src/lib/trpc/routes/general/orders.ts src/lib/support/cancel-order-helper.ts docs/.work-items/REN-174 docs/superpowers/plans/2026-09-03-ren-174-inventory-cancellation.md
git commit -m "fix: restore inventory correctly on cancellation"
```
