import { describe, expect, test } from "bun:test";
import {
    buildFestiveCatalogOrdering,
    getFestiveCatalogLimit,
    rankFestiveProductIds,
    rankProductIdsBySubcategory,
} from "./merchandising";

const products = [
    {
        id: "women-50",
        title: "Women Gift Set",
        categoryName: "Women",
        subcategoryName: "Dresses",
        price: 500,
        compareAtPrice: 1000,
    },
    {
        id: "home-40",
        title: "Home Decor",
        categoryName: "Home & Living",
        subcategoryName: "Decor",
        price: 600,
        compareAtPrice: 1000,
    },
    {
        id: "aroma-30",
        title: "Aroma Candle",
        categoryName: "Home & Living",
        subcategoryName: "Aromas & Candles",
        price: 700,
        compareAtPrice: 1000,
    },
    {
        id: "men-60",
        title: "Men Shirt",
        categoryName: "Men",
        subcategoryName: "Topwear",
        price: 400,
        compareAtPrice: 1000,
    },
];

describe("catalog merchandising", () => {
    test("ranks the above-30% band before the 30%-and-below band", () => {
        expect(rankFestiveProductIds(products)).toEqual([
            "home-40",
            "women-50",
            "men-60",
            "aroma-30",
        ]);
    });

    test("preserves category order inside both discount bands", () => {
        expect(
            rankFestiveProductIds([
                ...products,
                {
                    id: "home-80",
                    title: "Home Cushion",
                    categoryName: "Home & Living",
                    subcategoryName: "Decor",
                    price: 200,
                    compareAtPrice: 1000,
                },
            ])
        ).toEqual(["home-80", "home-40", "women-50", "men-60", "aroma-30"]);
    });

    test("uses Home & Living, Beauty Products, Women, then Men for equal discounts", () => {
        expect(
            rankFestiveProductIds([
                {
                    id: "men",
                    categoryName: "Men",
                    price: 700,
                    compareAtPrice: 1000,
                },
                {
                    id: "beauty",
                    categoryName: "Beauty Products",
                    price: 700,
                    compareAtPrice: 1000,
                },
                {
                    id: "women",
                    categoryName: "Women",
                    price: 700,
                    compareAtPrice: 1000,
                },
                {
                    id: "home",
                    categoryName: "Home & Living",
                    price: 700,
                    compareAtPrice: 1000,
                },
            ])
        ).toEqual(["home", "beauty", "women", "men"]);
    });

    test("puts exactly 30% in the second Festive discount band", () => {
        expect(
            rankFestiveProductIds([
                {
                    id: "men-60",
                    categoryName: "Men",
                    price: 400,
                    compareAtPrice: 1000,
                },
                {
                    id: "home-40",
                    categoryName: "Home and Living",
                    price: 600,
                    compareAtPrice: 1000,
                },
                {
                    id: "beauty-35",
                    categoryName: "Beauty and Personal Care",
                    price: 650,
                    compareAtPrice: 1000,
                },
                {
                    id: "women-30",
                    categoryName: "Women",
                    price: 700,
                    compareAtPrice: 1000,
                },
                {
                    id: "men-25",
                    categoryName: "Men",
                    price: 750,
                    compareAtPrice: 1000,
                },
                {
                    id: "home-20",
                    categoryName: "Home and Living",
                    price: 800,
                    compareAtPrice: 1000,
                },
                {
                    id: "beauty-15",
                    categoryName: "Beauty and Personal Care",
                    price: 850,
                    compareAtPrice: 1000,
                },
                {
                    id: "women-10",
                    categoryName: "Women",
                    price: 900,
                    compareAtPrice: 1000,
                },
            ])
        ).toEqual([
            "home-40",
            "beauty-35",
            "men-60",
            "home-20",
            "beauty-15",
            "women-30",
            "women-10",
            "men-25",
        ]);
    });

    test("builds one ranked order for server render and lazy-loaded pages", () => {
        expect(
            buildFestiveCatalogOrdering(
                [
                    {
                        productId: "men",
                        product: {
                            id: "men",
                            categoryId: "cat-men",
                            subcategoryId: "sub-men",
                            price: 400,
                            compareAtPrice: 1000,
                        },
                    },
                    {
                        productId: "home",
                        product: {
                            id: "home",
                            categoryId: "cat-home",
                            subcategoryId: "sub-home",
                            price: 600,
                            compareAtPrice: 1000,
                        },
                    },
                ],
                [
                    { id: "cat-men", name: "Men" },
                    { id: "cat-home", name: "Home and Living" },
                ],
                [
                    { id: "sub-men", name: "Topwear" },
                    { id: "sub-home", name: "Home Decor" },
                ]
            )
        ).toEqual({
            curatedProductIds: ["men", "home"],
            curatedDefaultOrder: ["home", "men"],
        });
    });

    test("keeps the initial Festive request at the lazy-load page size", () => {
        expect(getFestiveCatalogLimit(undefined, 43)).toBe(28);
        expect(getFestiveCatalogLimit(undefined, 12)).toBe(28);
    });

    test("honors an explicit shopper limit on the Festive catalogue", () => {
        expect(getFestiveCatalogLimit("16", 43)).toBe(16);
    });

    test("orders a brand catalogue by configured subcategory priority", () => {
        expect(
            rankProductIdsBySubcategory(
                [
                    { id: "inner", subcategoryName: "Innerwear" },
                    { id: "men", subcategoryName: "Men" },
                    { id: "bath", subcategoryName: "Bathwear" },
                    { id: "women", subcategoryName: "Women" },
                    { id: "accessories", subcategoryName: "Accessories" },
                ],
                ["Men", "Women", "Accessories", "Bathwear", "Innerwear"]
            )
        ).toEqual(["men", "women", "accessories", "bath", "inner"]);
    });
});
