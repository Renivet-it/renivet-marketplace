import { describe, expect, test } from "bun:test";
import {
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
    test("ranks the 30%+ band by category, then the below-30% band by category", () => {
        expect(rankFestiveProductIds(products)).toEqual([
            "home-40",
            "aroma-30",
            "women-50",
            "men-60",
        ]);
    });

    test("keeps every 30%+ product ahead of lower discounts while preserving category order", () => {
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
        ).toEqual(["home-80", "home-40", "aroma-30", "women-50", "men-60"]);
    });

    test("uses Home & Living, Beauty Products, Women, then Men for equal discounts", () => {
        expect(
            rankFestiveProductIds([
                { id: "men", categoryName: "Men", price: 700, compareAtPrice: 1000 },
                { id: "beauty", categoryName: "Beauty Products", price: 700, compareAtPrice: 1000 },
                { id: "women", categoryName: "Women", price: 700, compareAtPrice: 1000 },
                { id: "home", categoryName: "Home & Living", price: 700, compareAtPrice: 1000 },
            ])
        ).toEqual(["home", "beauty", "women", "men"]);
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
