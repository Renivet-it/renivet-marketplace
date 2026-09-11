import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

test("shop metadata and semantics are search-ready", async () => {
    const layout = await readFile(
        "src/app/(marketing)/shop/layout.tsx",
        "utf8"
    );
    const page = await readFile("src/app/(marketing)/shop/page.tsx", "utf8");

    expect(layout).toContain("Shop Sustainable Fashion & Eco Products");
    expect(layout).toContain(
        'alternates: { canonical: getAbsoluteURL("/shop") }'
    );
    expect(layout.match(/description:/g)?.length).toBeGreaterThan(0);
    expect(page).toContain(
        'pageHeading="Shop Sustainable Fashion & Eco Products"'
    );
});

test("site and content templates emit the approved SEO schema/canonicals", async () => {
    const root = await readFile("src/app/layout.tsx", "utf8");
    const product = await readFile(
        "src/app/(marketing)/products/[slug]/page.tsx",
        "utf8"
    );
    const blog = await readFile(
        "src/app/(marketing)/blogs/[slug]/page.tsx",
        "utf8"
    );
    const festive = await readFile(
        "src/components/shop/storefront-catalog-page.tsx",
        "utf8"
    );

    expect(root).toContain('"@type": "Organization"');
    expect(root).toContain('"@type": "WebSite"');
    expect(product).toContain("alternates: { canonical: url }");
    expect(blog).toContain('"@type": "BlogPosting"');
    expect(blog).toContain(
        "alternates: { canonical: getAbsoluteURL(`/blogs/${slug}`) }"
    );
    expect(festive).toContain('"@type": "ItemList"');
    expect(festive).not.toContain('"aggregateRating"');
});

test("homepage keeps one root H1 and sections use non-root headings", async () => {
    const home = await readFile("src/app/(home)/page.tsx", "utf8");
    const sectionFiles = [
        "src/components/home/new-home-page/discount-section.tsx",
        "src/components/home/new-home-page/everyday-essential.tsx",
        "src/components/home/shop-slow.tsx",
        "src/components/home/women/top-collection.tsx",
        "src/components/home/men/new-collection.tsx",
        "src/components/home/beauty-personal/product-new-arrival.tsx",
    ];

    expect(home).toContain(
        '<h1 className="sr-only">Renivet Sustainable Marketplace</h1>'
    );
    for (const file of sectionFiles) {
        expect(await readFile(file, "utf8")).not.toContain("<h1");
    }
});

test("sitemap is database-driven and excludes non-live products/brands", async () => {
    const sitemap = await readFile("src/app/sitemap.ts", "utf8");

    expect(sitemap).toContain("db.query.products.findMany");
    expect(sitemap).toContain("eq(products.isPublished, true)");
    expect(sitemap).toContain("eq(brands.isActive, true)");
    expect(sitemap).toContain("getAbsoluteURL(`/products/${product.slug}`)");
    expect(sitemap).toContain("getAbsoluteURL(`/brands/${brand.slug}/shop`)");
});
