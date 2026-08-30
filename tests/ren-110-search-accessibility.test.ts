import { describe, expect, test } from "bun:test";

const sourcePath = new URL(
    "../src/components/ui/product-search.tsx",
    import.meta.url
);

describe("REN-110 product search accessibility", () => {
    test("includes a visually hidden sheet description", async () => {
        const source = await Bun.file(sourcePath).text();
        expect(source).toContain("SheetDescription");
        expect(source).toContain('className="sr-only"');
    });
});
