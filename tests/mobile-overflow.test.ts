import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

test("clips horizontal viewport overflow on mobile pages", async () => {
    const mobileNavbar = await readFile(
        "src/components/globals/layouts/navbar/navbar-mob.tsx",
        "utf8"
    );

    expect(mobileNavbar).toContain('document.body.style.overflowY = "hidden"');
    expect(mobileNavbar).toContain("const originalOverflowY");
    expect(mobileNavbar).toContain(
        "document.body.style.overflowY = originalOverflowY"
    );
    expect(mobileNavbar).not.toContain('document.body.style.overflow = "auto"');
});
