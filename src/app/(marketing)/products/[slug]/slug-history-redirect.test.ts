import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("product slug history redirect", () => {
    test("checks history before notFound and preserves query parameters with a permanent redirect", async () => {
        const source = await readFile(
            "src/app/(marketing)/products/[slug]/page.tsx",
            "utf8"
        );
        expect(source).toContain("getHistoricalProductSlug");
        expect(source).toContain("permanentRedirect");
        expect(source).toContain("fbclid");
    });
});
