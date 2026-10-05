import { expect, test } from "bun:test";

test("REN-261 restores the editorial cards to festive-home", async () => {
    const page = await Bun.file("src/app/(home)/festive-home/page.tsx").text();

    expect(page).toContain("<FestiveEditorialCarousel />");
    expect(page).toContain('data-festive-section="editorial-cards"');
    expect(page).toContain('title: "Festive dressing"');
    expect(page).toContain('title: "Gifts with a story"');
    expect(page).toContain('title: "Home for the season"');
    expect(
        page.match(/data-festive-editorial-image="true"/g) ?? []
    ).toHaveLength(2);
    expect(page).toContain("src={`${assetRoot}/sandstone-arch.png`}");
    expect(page).toContain("md:hidden");

    const festiveCatalogPage = await Bun.file(
        "src/app/(home)/festive/page.tsx"
    ).text();
    expect(festiveCatalogPage).not.toContain("FestiveEditorialCarousel");
});
