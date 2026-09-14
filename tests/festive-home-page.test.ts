import { expect, test } from "bun:test";

const pagePath = "src/app/(home)/festive-home/page.tsx";

test("festive home defines the desktop editorial sections and keeps the shared shell", async () => {
    const source = await Bun.file(pagePath).text();
    const carousel = await Bun.file(
        "src/components/festive-home/festive-product-carousel.tsx"
    ).text();
    const brands = await Bun.file(
        "src/components/festive-home/festive-brand-showcase.tsx"
    ).text();

    expect(source).toContain("A More Conscious Festive Season");
    expect(carousel).toContain("Festive Edit");
    expect(brands).toContain("Brands worth discovering");
    expect(source).toContain("Gift by intention");
    expect(source).toContain("heritage-rail.png");
    expect(carousel).toContain("festive-edit-panel.png");
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
    const carousel = await Bun.file(
        "src/components/festive-home/festive-product-carousel.tsx"
    ).text();
    const brands = await Bun.file(
        "src/components/festive-home/festive-brand-showcase.tsx"
    ).text();

    expect(source).toContain('data-festive-section="hero"');
    expect(source).toContain('data-festive-section="editorial-cards"');
    expect(carousel).toContain('data-festive-section="festive-edit"');
    expect(source).toContain('data-festive-section="brand-story"');
    expect(brands).toContain('data-festive-section="brands"');
    expect(source).toContain('data-festive-section="gift-intention"');
    expect(source).toContain("lg:grid-cols-3");
    expect(brands).toContain("lg:grid-cols-6");
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

test("festive hero shop-the-edit actions open the festive catalogue", async () => {
    const source = await Bun.file(pagePath).text();
    const heroCtas = source.match(/data-festive-hero-cta="true"/g) ?? [];
    const festiveLinks = source.match(/href="\/festive"/g) ?? [];

    expect(heroCtas).toHaveLength(2);
    expect(festiveLinks.length).toBeGreaterThanOrEqual(2);
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
    expect(source).toContain(
        'overlay: "from-black/50 via-black/10 to-transparent"'
    );
    expect(source).toContain(
        'overlay: "from-black/70 via-black/15 to-black/5"'
    );
});

test("festive editorial cards link to their curated catalogue filters", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain(
        'href: "/festive?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1"'
    );
    expect(source).toContain(
        'href: "/festive?subCategoryId=72d7d263-fde3-4e70-9544-afbd5b24294b"'
    );
    expect(source).toContain(
        'href: "/festive?subCategoryId=cd98e50e-02d6-4bc4-bc1e-7b0ba5b6dd0e"'
    );
    expect(source).toContain("href={card.href}");
});

test("festive home leaves breathing room above the editorial corner artwork", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain('data-festive-section="editorial-transition"');
    expect(source).toContain("h-[130px]");
    expect(source).toContain(
        'className="absolute bottom-0 left-0 w-[170px] -scale-x-100"'
    );
    expect(source).toContain('className="absolute bottom-0 right-0 w-[170px]"');
});

test("festive home stacks portrait editorial cards with imagery on mobile", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain("aspect-[0.94]");
    expect(source).toContain("md:aspect-[1.75]");
    expect(source).toContain('data-festive-editorial-image="true"');
    expect(source).toContain("justify-end");
});

test("festive edit loads the ordered festive products table into a carousel", async () => {
    const source = await Bun.file(pagePath).text();
    const carousel = await Bun.file(
        "src/components/festive-home/festive-product-carousel.tsx"
    ).text();

    expect(source).toContain("productQueries.getFestiveSeasonProducts");
    expect(source).toContain("festiveSelection.map");
    expect(source).toContain("curatedProductIds");
    expect(source).toContain("curatedDefaultOrder: curatedProductIds");
    expect(carousel).not.toContain("FALLBACK_FESTIVE_PRODUCTS");
    expect(source).toContain("<FestiveProductCarousel");
    expect(carousel).toContain("<Carousel");
    expect(carousel).toContain("<CarouselItem");
    expect(carousel).toContain("<ProductCard");
    expect(carousel).toContain("festive-edit-panel.png");
});

test("festive edit keeps its curation panel beside the swipeable products on mobile", async () => {
    const carousel = await Bun.file(
        "src/components/festive-home/festive-product-carousel.tsx"
    ).text();

    expect(carousel).toContain("grid-cols-[145px_minmax(0,1fr)]");
    expect(carousel).toContain("basis-[145px]");
    expect(carousel).toContain("h-[46px]");
    expect(carousel).toContain("bg-[#eef0d6]");
});

test("festive product images fill a positioned wrapper instead of a zero-height link", async () => {
    const productCard = await Bun.file(
        "src/components/globals/cards/product.tsx"
    ).text();
    const animatedLink = await Bun.file(
        "src/components/home/new-home-page/animated-product-link.tsx"
    ).text();
    expect(productCard).toContain('className="absolute inset-0 block"');
    expect(productCard).toContain('contentClassName="h-full"');
    expect(productCard).not.toContain('className="block h-full w-full"');
    expect(animatedLink).toContain("contentClassName?: string");
    expect(animatedLink).toContain(
        '"relative z-[1] block transition duration-200"'
    );
    expect(animatedLink).toContain("contentClassName");
});

test("festive carousel product images load immediately when the row is visible", async () => {
    const productCard = await Bun.file(
        "src/components/globals/cards/product.tsx"
    ).text();
    const editorialStart = productCard.indexOf('theme === "festive-editorial"');
    const editorialImage = productCard.slice(
        editorialStart,
        productCard.indexOf("</AnimatedProductLink>", editorialStart)
    );

    expect(editorialImage).toContain('loading="eager"');
});

test("festive product admin changes revalidate the festive home collection", async () => {
    const actions = await Bun.file("src/actions/product-action.ts").text();
    const toggleAction = actions.slice(
        actions.indexOf("export async function toggleFestiveSeasonProduct"),
        actions.indexOf("export async function toggleBestSeller")
    );

    expect(
        toggleAction.match(/revalidatePath\("\/festive-home"\)/g)
    ).toHaveLength(2);
});

test("brand story uses the supplied campaign artwork", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain("brand-story-women.png");
    expect(source).toContain("brand-story-men.png");
    expect(source).toContain('alt="Woman wearing a pink festive saree"');
    expect(source).toContain('alt="Man wearing festive everyday menswear"');
    expect(source).toContain("grayscale");
});

test("brand story preserves both portrait compositions on desktop", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain("lg:grid-cols-[30%_41.5%_28.5%]");
    expect(source).toContain("lg:aspect-[2.9]");
    expect(source).toContain("lg:min-h-0");
    expect(source).toContain("lg:h-full");
    expect(source).toContain("lg:object-contain");
});

test("brand story uses the supplied mobile-only celebration artwork", async () => {
    const source = await Bun.file(pagePath).text();
    const mobileImages = [
        "brand-story-mobile-uruli.png",
        "brand-story-mobile-lotus-field.png",
    ];

    for (const image of mobileImages) {
        expect(
            await Bun.file(`public/assets/festive-home/${image}`).exists()
        ).toBe(true);
        expect(source).toContain(image);
    }
    expect(source).toContain("lg:hidden");
    expect(source).toContain("hidden object-cover lg:block");
});

test("gift by intention uses the five supplied images in display order", async () => {
    const source = await Bun.file(pagePath).text();
    const expectedImages = [
        "gift-for-her.png",
        "gift-for-him.png",
        "gift-for-home.png",
        "gift-under-2000.png",
        "gift-host.png",
    ];

    expectedImages.forEach((image, index) => {
        expect(source).toContain(image);
        if (index > 0) {
            expect(source.indexOf(image)).toBeGreaterThan(
                source.indexOf(expectedImages[index - 1]!)
            );
        }
    });
    expect(source).toContain("gift.image");
    expect(source).not.toContain("label={`Gift ${index + 1}`}");
});

test("brands gifts and benefits follow the approved two-column mobile layout", async () => {
    const source = await Bun.file(pagePath).text();
    const brands = await Bun.file(
        "src/components/festive-home/festive-brand-showcase.tsx"
    ).text();

    expect(brands).toContain('data-festive-brand-grid="true"');
    expect(brands).toContain("grid-cols-2");
    expect(source).toContain('data-festive-gift-grid="true"');
    expect(source).toContain("last:col-span-2");
    expect(source).toContain('data-festive-benefits="true"');
    expect(source).toContain("lg:grid-cols-4");
});

test("heritage divider keeps desktop breathing room below the brand grid", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain('data-festive-heritage-divider="true"');
    expect(source).toContain("md:min-h-[132px]");
    expect(source).toContain("md:w-[94%]");
    expect(source).toContain("md:h-auto");
    expect(source).not.toContain("md:h-[64px]");
});

test("festive benefits use the supplied artwork in the approved order", async () => {
    const source = await Bun.file(pagePath).text();
    const expectedIcons = [
        "benefit-curated.png",
        "benefit-delivery.png",
        "benefit-returns.png",
        "benefit-tomorrow.png",
    ];

    for (const [index, icon] of expectedIcons.entries()) {
        expect(
            await Bun.file(`public/assets/festive-home/${icon}`).exists()
        ).toBe(true);
        expect(source).toContain(icon);
        if (index > 0) {
            expect(source.indexOf(icon)).toBeGreaterThan(
                source.indexOf(expectedIcons[index - 1]!)
            );
        }
    }
});

test("festive benefits span the full desktop viewport", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain("lg:left-1/2");
    expect(source).toContain("lg:w-screen");
    expect(source).toContain("lg:-translate-x-1/2");
});

test("festive benefits retain a cream gap before the footer", async () => {
    const source = await Bun.file(pagePath).text();

    expect(source).toContain('data-festive-bottom-spacer="true"');
    expect(source).toContain("h-12 md:h-20");
});

test("festive home is not obscured by the global guest acquisition popup", async () => {
    const popup = await Bun.file(
        "src/components/globals/modals/guest-add-to-cart-popup.tsx"
    ).text();

    expect(popup).toContain("usePathname");
    expect(popup).toContain('pathname === "/festive-home"');
});

test("festive home loads active brands and links them to their public shops", async () => {
    const source = await Bun.file(pagePath).text();
    const showcasePath =
        "src/components/festive-home/festive-brand-showcase.tsx";

    expect(await Bun.file(showcasePath).exists()).toBe(true);
    const showcase = await Bun.file(showcasePath).text();

    expect(source).toContain("brandCache");
    expect(source).toContain(".getAll()");
    expect(source).toContain("brand.isActive");
    expect(source).toContain("localeCompare");
    expect(source).toContain("<FestiveBrandShowcase");
    expect(showcase).toContain("/brands/${brand.slug}/shop");
    expect(showcase).toContain("brand.logoUrl");
    expect(showcase).toContain('data-festive-brand-name="true"');
});

test("festive brand showcase opens an alphabetical responsive all-brands dialog", async () => {
    const showcasePath =
        "src/components/festive-home/festive-brand-showcase.tsx";

    expect(await Bun.file(showcasePath).exists()).toBe(true);
    const showcase = await Bun.file(showcasePath).text();

    expect(showcase).toContain("View all brands");
    expect(showcase).toContain("<Dialog");
    expect(showcase).toContain("<DialogTrigger");
    expect(showcase).toContain("<DialogContent");
    expect(showcase).toContain("All brands");
    expect(showcase).toContain("grid-cols-2");
    expect(showcase).toContain("md:grid-cols-3");
    expect(showcase).toContain("overflow-y-auto");
});
