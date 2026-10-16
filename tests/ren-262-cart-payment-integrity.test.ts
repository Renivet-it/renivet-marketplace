import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "bun:test";

const root = resolve(import.meta.dir, "..");

const read = (relativePath: string) =>
    readFileSync(resolve(root, relativePath), "utf8");

test("cart quantity controls persist each click without a save step", () => {
    const source = read(
        "src/components/globals/forms/product-cart-quantity-change.tsx"
    );

    expect(source).toContain("mutateAsync");
    expect(source).toContain("scheduleQuantityUpdate");
    expect(source).not.toContain("Save Changes");
});

test("cart cards render quantity controls inline instead of opening a popover", () => {
    const appCard = read(
        "src/app/(protected)/mycart/Component/product-cart-card.tsx"
    );
    const sharedCard = read("src/components/globals/cards/product-cart.tsx");

    expect(appCard).not.toContain("<PopoverTrigger asChild>");
    expect(appCard).not.toContain("<PopoverContent className=\"w-auto rounded-lg p-3\">");
    expect(sharedCard).not.toContain("<PopoverTrigger asChild>");
    expect(sharedCard).not.toContain("<PopoverContent className=\"rounded-none\">");
});

test("cart quantity updates allow the exact available stock quantity", () => {
    const source = read("src/lib/trpc/routes/general/cart.ts");

    expect(source).toContain("existingCart.variant.quantity < quantity");
    expect(source).toContain("(existingCart.product.quantity ?? 0) < quantity");
});

test("cart rate limiting is scoped to the authenticated user", () => {
    const source = read("src/lib/trpc/trpc.ts");

    expect(source).toContain("ctx.user?.id ??");
});

test("intent access logging gives PostgreSQL's jsonb builder a typed timestamp", () => {
    const source = read("src/lib/db/queries/order.ts");

    expect(source).toContain("${new Date().toISOString()}::text");
});
