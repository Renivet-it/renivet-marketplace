import { expect, test } from "bun:test";

test("search trigger displays the active query instead of resetting to the placeholder", async () => {
    const source = await Bun.file(
        new URL("../src/components/ui/product-search.tsx", import.meta.url)
    ).text();

    expect(source).toContain('{localSearch || "Search for products, brands..."}');
});
