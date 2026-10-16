import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";
import { getFeaturedBrandPreview } from "./featured-brands";

test("featured brands uses the shared storefront priority order and limits the strip to five", () => {
    const brands = [
        { id: "1", name: "Zeta", slug: "zeta", logoUrl: null },
        {
            id: "2",
            name: "Terra Luna",
            slug: "terra-luna",
            logoUrl: "terra.png",
        },
        {
            id: "3",
            name: "Bamboology",
            slug: "bamboology",
            logoUrl: "bamboo.png",
        },
        { id: "4", name: "Earthpiece", slug: "earthpiece", logoUrl: null },
        { id: "5", name: "Chaasath", slug: "chaasath", logoUrl: null },
        { id: "6", name: "Alpha", slug: "alpha", logoUrl: null },
    ];

    expect(getFeaturedBrandPreview(brands).map((brand) => brand.name)).toEqual([
        "Terra Luna",
        "Bamboology",
        "Alpha",
        "Chaasath",
        "Earthpiece",
    ]);
});

test("featured brands appears directly below thoughtful products", () => {
    const page = readFileSync("src/app/(home)/page.tsx", "utf8");
    const thoughtfulPosition = page.indexOf("<ThoughtfulProducts />");
    const brandsPosition = page.indexOf("<FeaturedBrandsFetch />");

    expect(thoughtfulPosition).toBeGreaterThan(-1);
    expect(brandsPosition).toBeGreaterThan(thoughtfulPosition);
    expect(page).not.toContain("<ProductsUnder999Fetch />");
});

test("featured brands reuses the navbar all-brands dialog", () => {
    const source = readFileSync(
        "src/components/home/new-home-page/featured-brands.tsx",
        "utf8"
    );

    expect(source).toContain("AllBrandsDialog");
});
