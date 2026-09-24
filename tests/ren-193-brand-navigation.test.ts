import {
    filterStorefrontBrands,
    sortStorefrontBrands,
} from "@/lib/brands/storefront-brand-order";
import { expect, test } from "bun:test";

const brand = (
    name: string,
    slug = name.toLowerCase().replaceAll(" ", "-")
) => ({
    id: slug,
    name,
    slug,
    logoUrl: null,
});

test("REN-193 orders known brands by business priority and the remainder alphabetically", () => {
    const ordered = sortStorefrontBrands([
        brand("Zed Studio"),
        brand("Bamboology"),
        brand("Greysome"),
        brand("My Mithila"),
        brand("Alpha Studio"),
        brand("RASA HOME"),
        brand("O'CAU"),
    ]);

    expect(ordered.map(({ name }) => name)).toEqual([
        "My Mithila",
        "Greysome",
        "RASA HOME",
        "O'CAU",
        "Bamboology",
        "Alpha Studio",
        "Zed Studio",
    ]);
});

test("REN-193 does not reserve empty positions for unavailable priority brands", () => {
    const ordered = sortStorefrontBrands([
        brand("Onearth"),
        brand("Independent Label"),
    ]);

    expect(ordered).toHaveLength(2);
    expect(ordered.map(({ name }) => name)).toEqual([
        "Onearth",
        "Independent Label",
    ]);
});

test("REN-193 brand search is case-insensitive and preserves priority ordering", () => {
    const matches = filterStorefrontBrands(
        [brand("Raasaa"), brand("Rasa Homes"), brand("Other")],
        "RASA"
    );

    expect(matches.map(({ name }) => name)).toEqual(["Rasa Homes", "Raasaa"]);
});

test("REN-193 exposes only an active public brand projection and integrates both viewports", async () => {
    const router = await Bun.file(
        "src/lib/trpc/routes/general/brands.ts"
    ).text();
    const navbar = await Bun.file(
        "src/components/globals/layouts/navbar/navbar-home.tsx"
    ).text();
    const landing = await Bun.file("src/components/home/landing.tsx").text();
    const navigation = await Bun.file(
        "src/components/globals/layouts/navbar/brand-navigation.tsx"
    ).text();

    expect(router).toContain("getStorefrontBrands: publicProcedure");
    expect(router).toContain("where: eq(brands.isActive, true)");
    expect(router).toContain("logoUrl: true");
    expect(router).not.toContain("getStorefrontBrands: protectedProcedure");

    expect(navbar).toContain("BrandDesktopNavigationItem");
    expect(navbar).toContain("general.brands.getStorefrontBrands.useQuery");
    expect(navbar).not.toContain("<BrandMobileNavigation");
    expect(landing).toContain("<BrandMobileNavigation");
    expect(landing).toContain("general.brands.getStorefrontBrands.useQuery");
    expect(navigation).toContain("BRANDS");
    expect(navigation).toContain("View All Brands");
    expect(navigation).toContain("Browse brands");
    expect(navigation).toContain("/brands/${brand.slug}/shop");
});

test("REN-193 keeps Brands after the category navigation and uses the category mega-menu width", async () => {
    const navbar = await Bun.file(
        "src/components/globals/layouts/navbar/navbar-home.tsx"
    ).text();
    const navigation = await Bun.file(
        "src/components/globals/layouts/navbar/brand-navigation.tsx"
    ).text();

    expect(navbar.indexOf("<BrandDesktopNavigationItem")).toBeGreaterThan(
        navbar.indexOf("categories.data")
    );
    expect(navbar).toContain('className="hidden items-center gap-0.5 lg:flex"');
    expect(navigation).toContain("w-[1180px] max-w-[95vw]");
});

test("REN-193 expands all mobile brands inside the same bottom sheet", async () => {
    const navigation = await Bun.file(
        "src/components/globals/layouts/navbar/brand-navigation.tsx"
    ).text();
    const mobileNavigation = navigation.slice(
        navigation.indexOf("export function BrandMobileNavigation")
    );

    expect(mobileNavigation).toContain("const [showAll, setShowAll]");
    expect(mobileNavigation).toContain("showAll ? orderedBrands : preview");
    expect(mobileNavigation).not.toContain("<AllBrandsDialog");
    expect(mobileNavigation).not.toContain("window.setTimeout");
});

test("REN-193 places the mobile brand trigger after the home category circles", async () => {
    const landing = await Bun.file("src/components/home/landing.tsx").text();
    const navigation = await Bun.file(
        "src/components/globals/layouts/navbar/brand-navigation.tsx"
    ).text();

    expect(landing.indexOf("<BrandMobileNavigation")).toBeGreaterThan(
        landing.indexOf("categories.map")
    );
    expect(landing).toContain(
        'triggerClassName="size-12 min-[390px]:size-[52px] min-[420px]:size-14'
    );
    expect(navigation).toContain("triggerClassName?: string");
    expect(navigation).toContain("Brands");
});
