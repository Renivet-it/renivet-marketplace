import { describe, expect, test } from "bun:test";

const sourcePath = new URL(
    "../src/app/(home)/festive/page.tsx",
    import.meta.url
);
const campaignPath = new URL(
    "../src/lib/seo/festive-campaign.ts",
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

    test("maps the festive hero to the approved pink campaign artwork", async () => {
        const campaign = await Bun.file(campaignPath).text();

        expect(campaign).toContain(
            'src: "/assets/festive-season/festive-banner-desktop.png"'
        );
        expect(campaign).toContain(
            'src: "/assets/festive-season/festive-banner.png"'
        );
        expect(campaign).not.toContain("rakhi-mobile-cutout");
    });
});
