import { expect, test } from "bun:test";

const pagePath = "src/app/(home)/festive-home/page.tsx";

test("festive home defines the desktop editorial sections and keeps the shared shell", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain("A More Conscious Festive Season");
    expect(source).toContain("Festive Edit");
    expect(source).toContain("Brands worth discovering");
    expect(source).toContain("Gift by intention");
    expect(source).toContain("heritage-rail.png");
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
    expect(source).toContain("lg:grid-cols-3");
    expect(source).toContain("lg:grid-cols-6");
    expect(source).toContain("lg:grid-cols-5");
});

test("festive home starts with the supplied full-width campaign cover", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain(
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNxRLtEs1IezOinSmtdvjDw08UlbRkW2MQqNBX"
    );
    expect(source).toContain('alt="A more conscious festive season"');
    expect(source).toContain('data-festive-hero-copy="true"');
    expect(source).not.toContain('label="Main campaign portrait"');
});

test("festive home uses the supplied portrait campaign cover on mobile", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain(
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNboUTcKuZc50VbmLPHAdU9KwxEkCINyqDWJRr"
    );
    expect(source).toContain('data-festive-mobile-cover="true"');
    expect(source).toContain("Better");
    expect(source).toContain("Choices");
});

test("festive home maps the desktop editorial images to the referenced cards", async () => {
    const source = await Bun.file(pagePath).text();
    const urls = [
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNm2vhhBZNpGL6AgslOfF3vz5Wa1NUerQXMBIP",
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRrXG4iwzxCX9qouDwr5d6fTcizLeZ0I4snJv",
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNKP6iPRoXWY4M9GmONJv38rnKquVZUx0pjkQE",
    ];

    const positions = urls.map((url) => source.indexOf(url));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(source).toContain("aspect-[1.75]");
    expect(source).toContain("objectPosition");
    expect(source).toContain("max-w-[220px]");
    expect(source).toContain("titleLines");
});

test("festive home leaves breathing room above the editorial corner artwork", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain('data-festive-section="editorial-transition"');
    expect(source).toContain("h-[130px]");
});

test("festive home is not obscured by the global guest acquisition popup", async () => {
    const popup = await Bun.file(
        "src/components/globals/modals/guest-add-to-cart-popup.tsx"
    ).text();

    expect(popup).toContain("usePathname");
    expect(popup).toContain('pathname === "/festive-home"');
});
