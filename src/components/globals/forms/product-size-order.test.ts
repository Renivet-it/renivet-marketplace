import { expect, test } from "bun:test";
import {
    isProductSizeOptionName,
    sortProductSizeValues,
} from "./product-size-order";

test("orders alpha sizes from smallest to largest regardless of saved order", () => {
    const sizes = ["XL", "L", "M", "S", "XS", "XXL", "XXS"].map(
        (name) => ({ name })
    );

    expect(sortProductSizeValues(sizes).map((size) => size.name)).toEqual([
        "XXS",
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL",
    ]);
});

test("orders extended and aliased alpha sizes with stable equal-size aliases", () => {
    const sizes = ["5XL", "3XL", "2XL", "XL", "2XS", "XXS", "XS"].map(
        (name) => ({ name })
    );

    expect(sortProductSizeValues(sizes).map((size) => size.name)).toEqual([
        "2XS",
        "XXS",
        "XS",
        "XL",
        "2XL",
        "3XL",
        "5XL",
    ]);
});

test("orders written size names and X-size aliases case-insensitively", () => {
    const sizes = ["X-Large", "Large", "Medium", "X-Small", "Small"].map(
        (name) => ({ name })
    );

    expect(sortProductSizeValues(sizes).map((size) => size.name)).toEqual([
        "X-Small",
        "Small",
        "Medium",
        "Large",
        "X-Large",
    ]);
});

test("orders numeric shoe or clothing sizes and decimal sizes numerically", () => {
    const sizes = ["EU 40", "EU 36", "EU 38", "37.5", "39"].map(
        (name) => ({ name })
    );

    expect(sortProductSizeValues(sizes).map((size) => size.name)).toEqual([
        "EU 36",
        "37.5",
        "EU 38",
        "39",
        "EU 40",
    ]);
});

test("sorts numeric ranges and keeps unknown size labels after known sizes", () => {
    const ranges = ["4-6", "0-2", "2-4"].map((name) => ({ name }));
    const named = ["Free Size", "M", "One Size", "S"].map((name) => ({ name }));

    expect(sortProductSizeValues(ranges).map((size) => size.name)).toEqual([
        "0-2",
        "2-4",
        "4-6",
    ]);
    expect(sortProductSizeValues(named).map((size) => size.name)).toEqual([
        "S",
        "M",
        "Free Size",
        "One Size",
    ]);
});

test("recognizes size option names without matching unrelated options", () => {
    expect(isProductSizeOptionName("Size")).toBe(true);
    expect(isProductSizeOptionName("Sizes")).toBe(true);
    expect(isProductSizeOptionName("Shoe Size")).toBe(true);
    expect(isProductSizeOptionName("Color")).toBe(false);
});
