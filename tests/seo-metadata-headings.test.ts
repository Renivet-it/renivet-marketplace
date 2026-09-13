import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

const SHOP_TITLE = "Shop Sustainable Fashion & Eco Products";
const SHOP_DESCRIPTION =
    "Shop sustainable fashion and eco products from verified brands on Renivet. Discover conscious clothing, accessories, home goods, and lifestyle essentials.";
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
    expect(festive).toContain("heading={FESTIVE_CAMPAIGN.heading}");
    expect(festive).toContain('headingLevel="h1"');
    expect(festiveSeason).toContain("const Heading = headingLevel;");
    expect(festiveSeason).toContain("<Heading>{heading}</Heading>");
});

test("composed home, shop, and festive documents each own exactly one H1", async () => {
    const [
        home,
        homeLayout,
        shop,
        shopLayout,
        storefront,
        festive,
        footer,
        headingGuard,
    ] = await Promise.all([
        readFile("src/app/(home)/page.tsx", "utf8"),
        readFile("src/app/(home)/layout.tsx", "utf8"),
        readFile("src/app/(marketing)/shop/page.tsx", "utf8"),
        readFile("src/app/(marketing)/shop/layout.tsx", "utf8"),
        readFile("src/components/shop/storefront-catalog-page.tsx", "utf8"),
        readFile("src/app/(home)/festive/page.tsx", "utf8"),
        readFile("src/components/globals/layouts/footer/footer.tsx", "utf8"),
        readFile("scripts/seo/validate-heading-usage.ts", "utf8"),
    ]);

    const countLiteralH1s = (source: string) =>
        (source.match(/<h1\b/g) ?? []).length;

    expect(countLiteralH1s([home, homeLayout, footer].join("\n"))).toBe(1);
    expect(
        countLiteralH1s([shop, shopLayout, storefront, footer].join("\n"))
    ).toBe(1);
    expect(countLiteralH1s([festive, footer].join("\n"))).toBe(0);
    expect(footer).not.toMatch(/<h1\b/);
    expect(footer).toContain('<p className="text-4xl font-bold">');
    expect(headingGuard).toContain('route: "/"');
    expect(headingGuard).toContain('route: "/shop"');
    expect(headingGuard).toContain('route: "/festive"');
    expect(headingGuard).toContain("const Heading = headingLevel;");
    expect(headingGuard).toContain("<Heading>{heading}</Heading>");
});

test("festive keeps its meaningful H1 and an empty state when no products are selected", async () => {
    const festiveSeason = await readFile(
        "src/components/home/new-home-page/festive-season.tsx",
        "utf8"
    );

    expect(festiveSeason).not.toContain("if (!products.length) return null;");
    expect(festiveSeason).toContain("const hasProducts = products.length > 0;");
    expect(festiveSeason).toMatch(
        /Festive products are being curated\. Please check\s+back soon\./
    );
});

test("festive campaign configuration is the single source for crawler-facing copy and art", async () => {
    const [festive, festiveSeason] = await Promise.all([
        readFile("src/app/(home)/festive/page.tsx", "utf8"),
        readFile(
            "src/components/home/new-home-page/festive-season.tsx",
            "utf8"
        ),
    ]);

    expect(festive).toContain('export const dynamic = "force-dynamic"');
    expect(festive).toContain(
        'import { FESTIVE_CAMPAIGN } from "@/lib/seo/festive-campaign"'
    );
    expect(festiveSeason).toContain(
        'import { FESTIVE_CAMPAIGN } from "@/lib/seo/festive-campaign"'
    );
    expect(festive).toContain("title: FESTIVE_CAMPAIGN.name");
    expect(festive).toContain("description: FESTIVE_CAMPAIGN.description");
    expect(festive).toContain("title: FESTIVE_CAMPAIGN.social.title");
    expect(festive).toContain(
        "description: FESTIVE_CAMPAIGN.social.description"
    );
    expect(festive).toContain("FESTIVE_CAMPAIGN.art.openGraph.src");
    expect(festive).toContain("FESTIVE_CAMPAIGN.art.openGraph.width");
    expect(festive).toContain("FESTIVE_CAMPAIGN.art.openGraph.height");
    expect(festive).toContain("FESTIVE_CAMPAIGN.art.openGraph.alt");
    expect(festive).toContain("name: FESTIVE_CAMPAIGN.name");
    expect(festive).toContain("heading={FESTIVE_CAMPAIGN.heading}");
    expect(festive).toContain('canonical: getAbsoluteURL("/festive")');
    expect(festive).toContain("buildProductItemListJsonLd");
    expect(festive).toContain("<FestiveSeason");
    expect(festive).toContain("prioritizeMobileHero");
    expect(festiveSeason).toContain("FESTIVE_CAMPAIGN.art.mobileHero.src");
    expect(festiveSeason).toContain("FESTIVE_CAMPAIGN.art.desktopHero.src");
    expect(festiveSeason).toContain("priority={prioritizeMobileHero}");
    expect(
        festiveSeason.match(/priority=\{prioritizeMobileHero\}/g)
    ).toHaveLength(1);
    expect(festiveSeason).not.toContain('rel="preload"');
    expect(festiveSeason).toContain('loading="lazy"');
    expect(festiveSeason).not.toContain('fetchPriority="high"');
});
