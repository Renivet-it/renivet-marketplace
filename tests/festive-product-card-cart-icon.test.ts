import { expect, test } from "bun:test";

test("uses a smaller festive red cart button with a white icon", async () => {
    const shopProducts = await Bun.file(
        new URL("../src/components/shop/shop-products.tsx", import.meta.url)
    ).text();
    const productCard = (
        await Bun.file(
            new URL(
                "../src/components/globals/cards/product.tsx",
                import.meta.url
            )
        ).text()
    ).replaceAll("\r\n", "\n");

    expect(shopProducts).toContain('theme?: "festive"');
    expect(shopProducts).toContain("theme={theme}");
    expect(productCard).toContain('"h-10 w-10 border-[#8B1E2D] bg-[#8B1E2D] text-white');
    expect(productCard).toContain('theme\n                                                    ? "size-3.5 text-white"');
});
