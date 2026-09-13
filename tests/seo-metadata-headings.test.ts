import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

const SHOP_TITLE = "Shop Sustainable Fashion & Eco Products";
const SHOP_DESCRIPTION =
    "Shop sustainable fashion and eco products from verified brands on Renivet. Discover conscious clothing, accessories, home goods, and lifestyle essentials.";
const FESTIVE_TITLE = "Festive Collection";
const FESTIVE_DESCRIPTION =
    "Discover Renivet's curated festive collection, selected for conscious celebrations and thoughtful gifting.";
const FESTIVE_HEADING =
    "Celebrate Consciously with Sustainable Festive Picks";

const homepageSectionFiles = [
    "src/components/home/new-home-page/discount-section.tsx",
    "src/components/home/new-home-page/everyday-essential.tsx",
    "src/components/home/shop-slow.tsx",
    "src/components/home/women/top-collection.tsx",
    "src/components/home/men/new-collection.tsx",
    "src/components/home/beauty-personal/product-new-arrival.tsx",
];

test("shop metadata is descriptive, canonical, and sized for search results", async () => {
    const layout = await readFile(
        "src/app/(marketing)/shop/layout.tsx",
        "utf8"
    );

    expect(SHOP_TITLE.length).toBeLessThan(60);
    expect(SHOP_DESCRIPTION.length).toBeGreaterThanOrEqual(150);
    expect(SHOP_DESCRIPTION.length).toBeLessThanOrEqual(160);
    expect(layout).toContain(`default: "${SHOP_TITLE}"`);
    expect(layout).toContain(`"${SHOP_DESCRIPTION}"`);
    expect(layout).toContain('canonical: getAbsoluteURL("/shop")');
});

test("dynamic product and blog pages emit clean canonical metadata without removing Task 2 schema", async () => {
    const [product, blog] = await Promise.all([
        readFile("src/app/(marketing)/products/[slug]/page.tsx", "utf8"),
        readFile("src/app/(marketing)/blogs/[slug]/page.tsx", "utf8"),
    ]);

    expect(product).toContain("alternates: { canonical: url }");
    expect(blog).toContain(
        "alternates: { canonical: getAbsoluteURL(`/blogs/${slug}`) }"
    );
    expect(blog).toContain("buildBlogPostingJsonLd");
});

test("homepage retains one root H1 while its six sections use non-root headings", async () => {
    const home = await readFile("src/app/(home)/page.tsx", "utf8");

    expect(home.match(/<h1\b/g)).toHaveLength(1);
    expect(home).toContain(
        '<h1 className="sr-only">Renivet Sustainable Marketplace</h1>'
    );

    for (const file of homepageSectionFiles) {
        const source = await readFile(file, "utf8");
        expect(source).not.toMatch(/<h1\b/);
    }
});

test("shop and festive routes each have one explicit H1 owner", async () => {
    const [shop, storefront, festive, festiveSeason] = await Promise.all([
        readFile("src/app/(marketing)/shop/page.tsx", "utf8"),
        readFile("src/components/shop/storefront-catalog-page.tsx", "utf8"),
        readFile("src/app/(home)/festive/page.tsx", "utf8"),
        readFile(
            "src/components/home/new-home-page/festive-season.tsx",
            "utf8"
        ),
    ]);

    expect(shop).toContain(`pageHeading="${SHOP_TITLE}"`);
    expect(storefront).toContain(
        '{pageHeading ? <h1 className="sr-only">{pageHeading}</h1> : null}'
    );
    expect(festive).toContain(`heading="${FESTIVE_HEADING}"`);
    expect(festive).toContain('headingLevel="h1"');
    expect(festiveSeason).toContain("const Heading = headingLevel;");
    expect(festiveSeason).toContain("<Heading>{heading}</Heading>");
});

test("festive metadata and image loading preserve the current route architecture", async () => {
    const [festive, festiveSeason] = await Promise.all([
        readFile("src/app/(home)/festive/page.tsx", "utf8"),
        readFile(
            "src/components/home/new-home-page/festive-season.tsx",
            "utf8"
        ),
    ]);

    expect(festive).toContain('export const dynamic = "force-dynamic"');
    expect(festive).toContain(`title: "${FESTIVE_TITLE}"`);
    expect(festive).toContain(`"${FESTIVE_DESCRIPTION}"`);
    expect(festive).toContain('canonical: getAbsoluteURL("/festive")');
    expect(festive).toContain('"/assets/festive-season/rakhi.png"');
    expect(festive).toContain("buildProductItemListJsonLd");
    expect(festive).toContain("<FestiveSeason");
    expect(festive).toContain("prioritizeMobileHero");
    expect(festiveSeason.match(/priority=\{prioritizeMobileHero\}/g)).toHaveLength(
        1
    );
    expect(festiveSeason).toContain('loading="lazy"');
});
