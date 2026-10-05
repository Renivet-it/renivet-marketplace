import { expect, test } from "bun:test";

test("REN-261 opts only the Bamboology brand route into category merchandising", async () => {
    const brandRoute = await Bun.file(
        "src/app/(marketing)/brands/[id]/shop/page.tsx"
    ).text();
    const catalog = await Bun.file(
        "src/components/shop/storefront-catalog-page.tsx"
    ).text();

    expect(brandRoute).toContain("brandMerchandising={");
    expect(brandRoute).toContain('brand.slug.toLowerCase() === "bamboology"');
    expect(catalog).toContain("rankProductIdsByCategoryAndSubcategory");
    expect(catalog).toContain('brandMerchandising === "bamboology"');
    expect(catalog).toContain(
        "prioritizedSubcategoryIds: effectivePrioritizedSubcategoryIds"
    );
});

test("REN-261 keeps merchandising priority off for explicit catalogue controls", async () => {
    const catalog = await Bun.file(
        "src/components/shop/storefront-catalog-page.tsx"
    ).text();

    expect(catalog).toMatch(
        /!categoryId\s*&&\s*!subCategoryId\s*&&\s*!productTypeId/
    );
    expect(catalog).toContain("!search");
    expect(catalog).toContain('!sortByRaw || sortByRaw === "recommended"');
});
