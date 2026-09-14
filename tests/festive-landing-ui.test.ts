import { describe, expect, test } from "bun:test";

const sourcePath = new URL(
    "../src/app/(home)/festive/page.tsx",
    import.meta.url
);

describe("festive landing UI", () => {
    test("uses the shared storefront catalogue with the approved festive banners", async () => {
        const source = await Bun.file(sourcePath).text();

        expect(source).toContain("Celebrate consciously");
        expect(source).toContain("FESTIVE_CAMPAIGN.art.mobileHero.src");
        expect(source).toContain("FESTIVE_CAMPAIGN.art.desktopHero.src");
        expect(source).toContain("StorefrontCatalogPage");
        expect(source).toContain("basePath=\"/festive\"");
        expect(source).toContain("catalogContext=\"festive\"");
        expect(source).toContain("defaultSortBy=\"recommended\"");
        expect(source).not.toContain("hideRecommendationSorts");
    });
});
