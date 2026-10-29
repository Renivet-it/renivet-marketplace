import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

test("the ReWear home card is mobile-only and links to the ReWear page", async () => {
    const card = await readFile(
        "src/components/home/rewear-mobile-cta.tsx",
        "utf8"
    );

    expect(card).toContain('href="/rewear"');
    expect(card).toContain("md:hidden");
    expect(card).toContain("home-clothes.png");
    expect(card).toContain("home-declutter.png");
    expect(card).toContain("home-track.png");
    expect(card).toContain("home-earn-karma.png");
    expect(card).toContain("home-cta-arrow.png");
    expect(card).toContain("font-sans");
    expect(card).not.toContain("font-serif");
});

test("the mobile ReWear card appears on the home page without the broken category block", async () => {
    const page = await readFile("src/app/(home)/page.tsx", "utf8");
    const swapSpace = await readFile(
        "src/components/home/new-home-page/swap-space.tsx",
        "utf8"
    );
    const rewearPosition = page.indexOf("<RewearMobileCta />");

    expect(rewearPosition).toBeGreaterThan(-1);
    expect(page).not.toContain("<ShopCategoryFetch />");
    expect(page).not.toContain("import { ShopByCategories }");
    expect(swapSpace).not.toContain("Shop by category");
});
