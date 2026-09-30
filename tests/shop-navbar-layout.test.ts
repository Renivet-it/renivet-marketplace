import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("shop desktop layout", () => {
    test("keeps the desktop navbar search within the available row width", async () => {
        const source = await readFile(
            "src/components/globals/layouts/navbar/navbar-home.tsx",
            "utf8"
        );

        expect(source).toContain("FALLBACK_CATEGORY_LINKS");
        expect(source).toContain("shouldShowCategoryFallback");
        expect(source).toContain("xl:flex");
        expect(source).toContain(
            "xl:w-[clamp(140px,14vw,320px)]"
        );
        expect(source).not.toContain("xl:min-w-[360px]");
    });

    test("uses compact vertical spacing for the shop catalog shell", async () => {
        const source = await readFile(
            "src/components/shop/storefront-catalog-page.tsx",
            "utf8"
        );

        expect(source).toContain(
            'classNames={{ innerWrapper: "py-2 md:py-2" }}'
        );
    });
});
