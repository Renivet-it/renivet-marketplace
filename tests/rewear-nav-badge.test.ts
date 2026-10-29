import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

test("the main navigation highlights ReWear with a new badge", async () => {
    const navbar = await readFile(
        "src/components/globals/layouts/navbar/navbar-home.tsx",
        "utf8"
    );

    expect(navbar).toContain('href="/rewear"');
    expect(navbar).toContain('aria-label="ReWear, new section"');
    expect(navbar).toContain("NEW");
});
