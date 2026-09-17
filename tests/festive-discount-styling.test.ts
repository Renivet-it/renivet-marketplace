import { expect, test } from "bun:test";

test("Festive Home editorial cards style discount percentages red", async () => {
    const source = await Bun.file("src/components/globals/cards/product.tsx").text();

    expect(source).toContain('theme === "festive-editorial"');
    expect(source).toContain("text-[#b4232f]");
});
