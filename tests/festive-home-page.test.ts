import { expect, test } from "bun:test";

const pagePath = "src/app/(home)/festive-home/page.tsx";

test("festive home defines the desktop editorial sections and keeps the shared shell", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain("A More Conscious Festive Season");
    expect(source).toContain("The Festive Edit");
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
