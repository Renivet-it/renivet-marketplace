import { describe, expect, test } from "bun:test";

const sourcePath = new URL(
    "../src/app/(protected)/mycart/Component/wardrobe-suggestions.tsx",
    import.meta.url
);

describe("REN-157 recommendation copy", () => {
    test("describes cart suggestions as similarity-based rather than complementary", async () => {
        const source = await Bun.file(sourcePath).text();

        expect(source).toContain("You might also like");
        expect(source).toContain("Matched using AI-powered similarity");
        expect(source).not.toContain("Pairs with items in your cart");
        expect(source).not.toContain("Complements your style choices");
        expect(source).not.toContain("Pairs well");
        expect(source).not.toContain("Complements your cart");
    });
});
