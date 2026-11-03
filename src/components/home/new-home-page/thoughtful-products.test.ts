import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";
import {
    THOUGHTFUL_PRODUCT_BENEFITS,
    THOUGHTFUL_PRODUCTS_MOBILE_IMAGE,
} from "./thoughtful-products";

test("thoughtful products keeps the approved four benefit messages and mobile image", () => {
    expect(THOUGHTFUL_PRODUCT_BENEFITS.map((benefit) => benefit.title)).toEqual(
        [
            "Fairer Making",
            "Better Materials",
            "Smaller Production",
            "Made to Last",
        ]
    );
    expect(THOUGHTFUL_PRODUCTS_MOBILE_IMAGE).toBe(
        "/assets/thoughtful-products/mobile-incense.png"
    );
});

test("Products Under 999 appears between curation and thoughtful products", () => {
    const page = readFileSync("src/app/(home)/page.tsx", "utf8");
    const curationPosition = page.indexOf("<HowRenivetCurates />");
    const affordablePosition = page.indexOf(
        "<ProductsUnder999Fetch userId={userId} />"
    );
    const thoughtfulPosition = page.indexOf("<ThoughtfulProducts />");

    expect(curationPosition).toBeGreaterThan(-1);
    expect(affordablePosition).toBeGreaterThan(curationPosition);
    expect(thoughtfulPosition).toBeGreaterThan(affordablePosition);
});
