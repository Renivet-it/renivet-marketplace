import { describe, expect, test } from "bun:test";
import {
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
    test("ranks Festive products by discount first, then category priority", () => {
        expect(rankFestiveProductIds(products)).toEqual([
            "aroma-30",
            "men-60",
            "women-50",
            "home-40",
        ]);
    });

    test("promotes 30%+ Aroma & Candles products ahead of other Festive items", () => {
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
        ).toEqual(["aroma-30", "home-80", "men-60", "women-50", "home-40"]);
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
