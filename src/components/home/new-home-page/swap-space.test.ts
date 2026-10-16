import { expect, test } from "bun:test";
import {
    BEST_SELLER_CARD_DIMENSIONS,
    getBestSellerBadge,
    MOBILE_HOME_CATEGORIES,
} from "./swap-space";

test("mobile home categories match the approved reference order and destinations", () => {
    expect(MOBILE_HOME_CATEGORIES).toEqual([
        {
            name: "Women",
            image: "/images/home-categories/women.png",
            href: "/women",
        },
        {
            name: "Men",
            image: "/images/home-categories/men.png",
            href: "/men",
        },
        {
            name: "Kids",
            image: "/images/home-categories/kids.png",
            href: "/kids",
        },
        {
            name: "Beauty",
            image: "/images/home-categories/beauty.png",
            href: "/beauty-personal",
        },
        {
            name: "Home & Living",
            image: "/images/home-categories/home-living.png",
            href: "/home-living",
        },
    ]);
});

test("best-seller cards use the approved fixed desktop and mobile dimensions", () => {
    expect(BEST_SELLER_CARD_DIMENSIONS).toEqual({
        desktop: { width: 278, height: 506 },
        mobile: { width: 163, height: 294 },
    });
});

test("best-seller cards prefer a sustainability specification for their badge", () => {
    expect(
        getBestSellerBadge({
            specifications: [
                { key: "Material", value: "Natural Materials" },
                { key: "Sustainability", value: "Zero Pesticide" },
            ],
        })
    ).toBe("Zero Pesticide");
});

test("best-seller cards use a neutral fallback badge without sustainability metadata", () => {
    expect(getBestSellerBadge({ specifications: [] })).toBe("Conscious choice");
});
