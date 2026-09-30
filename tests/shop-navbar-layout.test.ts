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
        expect(source).toContain("min-[1650px]:flex");
        expect(source).toContain(
            "min-[1650px]:w-[clamp(220px,20vw,320px)]"
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
