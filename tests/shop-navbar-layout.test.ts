import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("shop desktop layout", () => {
    test("keeps the desktop navbar search within the available row width", async () => {
        const source = await readFile(
            "src/components/globals/layouts/navbar/navbar-home.tsx",
            "utf8"
        );

        expect(source).toContain("min-w-0 flex-1");
        expect(source).toContain("shrink-0");
        expect(source).toContain("xl:flex");
        expect(source).toContain(
            "xl:w-[140px] min-[1360px]:w-[180px] min-[1500px]:w-[220px] min-[1650px]:w-[320px]"
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
