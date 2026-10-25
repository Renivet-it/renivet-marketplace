import { expect, test } from "bun:test";

test("Rewear page exists as a public route with the shared shell", async () => {
    const page = await Bun.file("src/app/(home)/rewear/page.tsx").text();

    expect(page).toContain("Rewear");
    expect(page).toContain("RenivetText");
    expect(page).toContain("assets will be placed here");
    expect(page).toContain("Make space for new beginnings.");
    expect(page).toContain("Clear about");
    expect(page).toContain("How it works");
    expect(page).toContain("Request your");
    expect(page).toContain("next chapter");
    expect(page).not.toContain("NavbarHome");
    expect(page).not.toContain("FooterWithLegal");
});
