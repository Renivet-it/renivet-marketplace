import { expect, test } from "bun:test";

test("uses a smaller festive pink cart button with a white icon", async () => {
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
    expect(productCard).toContain('"h-10 w-10 border-[#DF2463] bg-[#DF2463] text-white');
    expect(productCard).toContain('theme\n                                                    ? "size-3.5 text-white"');
});
