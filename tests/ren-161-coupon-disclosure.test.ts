import { describe, expect, test } from "bun:test";

const checkoutSources = [
    new URL(
        "../src/app/(protected)/checkout/checkout-content.tsx",
        import.meta.url
    ),
    new URL(
        "../src/app/(protected)/mycart/Component/checkout-section.tsx",
        import.meta.url
    ),
];

describe("REN-161 auto-applied coupon disclosure", () => {
    test("discloses automatic TRYNEW20 application in both checkout flows", async () => {
        const sources = await Promise.all(
            checkoutSources.map((sourcePath) => Bun.file(sourcePath).text())
        );

        for (const source of sources) {
            expect(source).toContain("TRYNEW20 was automatically applied");
        }
    });
});
