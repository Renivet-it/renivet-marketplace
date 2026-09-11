import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

test("festive mobile actions remove the extra bottom spacer", async () => {
    const frame = await readFile(
        "src/components/shop/festive-mobile-actions-frame.tsx",
        "utf8"
    );

    expect(frame).not.toContain("data-festive-bottom-spacing");
});

test("festive mobile actions hide when the site footer is visible", async () => {
    const actions = await readFile(
        "src/components/shop/shop-mobile-actions.tsx",
        "utf8"
    );
    const footer = await readFile(
        "src/components/globals/layouts/footer/footer.tsx",
        "utf8"
    );

    expect(actions).toContain("IntersectionObserver");
    expect(actions).toContain("[data-site-footer]");
    expect(footer).toContain('data-site-footer="true"');
});

test("festive search and category controls stay pinned while scrolling", async () => {
    const catalog = await readFile(
        "src/components/shop/storefront-catalog-page.tsx",
        "utf8"
    );

    expect(catalog).toContain("FestiveMobileCatalogHeader");
    expect(catalog).not.toContain("top-[200px]");

    const header = await readFile(
        "src/components/shop/festive-mobile-catalog-header.tsx",
        "utf8"
    );
    expect(header).toContain("sticky inset-x-0");
    expect(header).not.toContain("window.scrollY");
    expect(header).not.toContain("ResizeObserver");
});

test("swap progress stays compact and bottom-fixed", async () => {
    const widget = await readFile(
        "src/components/globals/swap-progress-float.tsx",
        "utf8"
    );

    expect(widget).not.toContain("window.scrollY");
    expect(widget).not.toContain("top-4");
    expect(widget).toContain(
        "bottom-[calc(86px+max(env(safe-area-inset-bottom),0px))]"
    );
    expect(widget).toContain("h-[56px]");
});

test("festive loading keeps the header shape and waits before showing actions", async () => {
    const loading = await readFile(
        "src/app/(home)/festive/loading.tsx",
        "utf8"
    );
    expect(loading).toContain("aria-busy");
    expect(loading).toContain("FestiveFloralDivider");
    expect(loading).toContain("Search for products, brands...");

    const catalog = await readFile(
        "src/components/shop/storefront-catalog-page.tsx",
        "utf8"
    );
    const suspenseStart = catalog.indexOf(
        "<Suspense fallback={<ShopProductsSkeleton theme={theme} />}>"
    );
    const suspenseEnd = catalog.indexOf("</Suspense>", suspenseStart);
    expect(suspenseStart).toBeGreaterThan(-1);
    expect(catalog.slice(suspenseStart, suspenseEnd)).toContain(
        "<ShopMobileActions"
    );
});

test("mobile header and festive actions fit a 360px viewport", async () => {
    const navbar = await readFile(
        "src/components/globals/layouts/navbar/navbar-home.tsx",
        "utf8"
    );
    expect(navbar).toContain("max-[380px]:w-[104px]");
    expect(navbar).toContain("max-[380px]:px-2");
    expect(navbar).toContain("max-[380px]:gap-1");

    const actions = await readFile(
        "src/components/shop/festive-mobile-actions-frame.tsx",
        "utf8"
    );
    expect(actions).toContain("[&_button]:min-w-0");
    expect(actions).toContain("[&_button]:truncate");
});
