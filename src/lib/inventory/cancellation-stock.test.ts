import { expect, test } from "bun:test";

test("customer cancellation passes a relative item delta", async () => {
    const source = await Bun.file(
        new URL("../trpc/routes/general/orders.ts", import.meta.url)
    ).text();
    const cancellationSource = source.slice(source.indexOf("cancelOrder:"));

    expect(cancellationSource).toContain("quantity: item.quantity");
    expect(cancellationSource).not.toContain(
        "quantity: currentStock + quantity"
    );
});

test("admin cancellation passes a relative item delta", async () => {
    const source = await Bun.file(
        new URL("../support/cancel-order-helper.ts", import.meta.url)
    ).text();

    expect(source).toContain("quantity: item.quantity");
    expect(source).not.toContain("quantity: currentStock + quantity");
});

test("shared stock mutation uses a zero floor", async () => {
    const source = await Bun.file(
        new URL("../db/queries/product.ts", import.meta.url)
    ).text();

    expect(source).toContain(
        "GREATEST(${productVariants.quantity} - ${item.quantity}, 0)"
    );
    expect(source).toContain(
        "GREATEST(${products.quantity} - ${item.quantity}, 0)"
    );
});
