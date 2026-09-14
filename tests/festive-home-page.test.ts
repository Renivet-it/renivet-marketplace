import { expect, test } from "bun:test";

const pagePath = "src/app/(home)/festive-home/page.tsx";

test("festive home defines the desktop editorial sections and keeps the shared shell", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain("A More Conscious Festive Season");
    expect(source).toContain("Festive Edit");
    expect(source).toContain("Brands worth discovering");
    expect(source).toContain("Gift by intention");
    expect(source).toContain("heritage-rail.png");
    expect(source).toContain("pond-peacock.png");
    expect(source).toContain("maroon-arch.png");
    expect(source).toContain("sandstone-arch.png");
    expect(source).toContain("/festive-home");
    expect(source).not.toContain("<NavbarHome");
    expect(source).not.toContain("<Footer");
});

test("festive home provides intentional placeholders for missing editorial imagery", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain("ImagePlaceholder");
    expect(source).toContain("image placeholder");
});

test("festive home mirrors the approved desktop section proportions", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain('data-festive-section="hero"');
    expect(source).toContain('data-festive-section="editorial-cards"');
    expect(source).toContain('data-festive-section="festive-edit"');
    expect(source).toContain('data-festive-section="brand-story"');
    expect(source).toContain('data-festive-section="brands"');
    expect(source).toContain('data-festive-section="gift-intention"');
    expect(source).toContain("lg:grid-cols-2");
    expect(source).toContain("lg:grid-cols-3");
    expect(source).toContain("lg:grid-cols-6");
    expect(source).toContain("lg:grid-cols-5");
});

test("festive home is not obscured by the global guest acquisition popup", async () => {
    const popup = await Bun.file(
        "src/components/globals/modals/guest-add-to-cart-popup.tsx"
    ).text();

    expect(popup).toContain("usePathname");
    expect(popup).toContain('pathname === "/festive-home"');
});
